'use client'

import React, { useState } from 'react'
import { Clipboard, Edit2, Trash2, ExternalLink, Plus } from 'lucide-react'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase, getMediaUrl } from '@/services/supabase'
import { buildDocumentHtml } from './EvaluationPdfTemplate'

// Core research ethics criteria checklist
export const EVALUATION_CRITERIA = [
  { key: 'obj', label: '1. วัตถุประสงค์และการออกแบบการวิจัย' },
  { key: 'method', label: '2. ความเหมาะสมของระเบียบวิธีวิจัยและกลุ่มตัวอย่าง' },
  { key: 'privacy', label: '3. การปกป้องสิทธิ์ ความเป็นส่วนตัว และข้อมูลส่วนบุคคล' },
  { key: 'consent', label: '4. ความสมบูรณ์ของแบบชี้แจงและใบยินยอม (Informed Consent)' },
  { key: 'risk', label: '5. มาตรการป้องกันและลดความเสี่ยงต่ออาสาสมัคร' },
  { key: 'benefit', label: '6. สัดส่วนประโยชน์ที่ได้รับเทียบกับความเสี่ยงมีความเหมาะสม' },
]

export const RISK_LEVEL_OPTIONS = [
  { value: '1', label: '1. ไม่เกินความเสี่ยงเล็กน้อย' },
  { value: '2', label: '2. เกินความเสี่ยงเล็กน้อยแต่มีประโยชน์โดยตรงแก่อาสาสมัคร' },
  { value: '3', label: '3. เกินความเสี่ยงเล็กน้อยและไม่มีประโยชน์โดยตรงแก่อาสาสมัครแต่มีโอกาสได้รับความรู้' },
  { value: '4', label: '4. ไม่ตรงกับทั้ง 3 กลุ่ม แต่มีโอกาสป้องกัน บรรเทา หรือแก้ปัญหาร้ายแรง' },
]

export const REPORT_INTERVAL_OPTIONS = [
  { value: '6', label: 'ทุก 6 เดือน' },
  { value: '12', label: 'ทุก 12 เดือน (1 ปี)' },
]

// Per-reviewer evaluation-level vocabulary (3-way): เห็นชอบ / ไม่อนุมัติ / ส่งกลับแก้ไข
export const EVALUATION_STATUS_LABELS: Record<string, string> = {
  'อนุมัติ': 'เห็นชอบ',
  'ไม่อนุมัติ': 'ไม่อนุมัติ',
  'ส่งกลับแก้ไข': 'ส่งกลับแก้ไข',
}

export const translateEvaluationStatus = (status: string): string =>
  EVALUATION_STATUS_LABELS[status] || status

// Derives submission-level status (ยื่นแล้ว / กำลังตรวจ / อนุมัติ / ไม่อนุมัติ) from the
// full set of per-reviewer evaluations for a submission, plus the assigned-reviewer
// count. Pure function — no Supabase access — so it can be reused from any future
// call site (e.g. an admin bulk-edit tool) without duplicating this logic.
//
// Rule (per user-confirmed Option A): "ส่งกลับแก้ไข" (send back for revision) is
// treated identically to "ไม่อนุมัติ" (reject) for derivation purposes — either
// non-approve value blocks the submission from ever reaching "อนุมัติ". There is no
// submission-level status for "ส่งกลับแก้ไข" — the enum stays exactly 4 values.
export const deriveSubmissionStatus = (
  evaluations: { status: string }[],
  assignedCount: number
): string => {
  if (evaluations.length === 0) return 'ยื่นแล้ว'
  if (evaluations.length < assignedCount) return 'กำลังตรวจ'
  // all assigned reviewers have submitted their evaluation
  const hasNonApprove = evaluations.some(
    (ev) => ev.status === 'ไม่อนุมัติ' || ev.status === 'ส่งกลับแก้ไข'
  )
  if (hasNonApprove) return 'ไม่อนุมัติ'
  const allApprove = evaluations.every((ev) => ev.status === 'อนุมัติ')
  if (allApprove) return 'อนุมัติ'
  // defensive fallback — should be unreachable once evaluation status is
  // constrained to {อนุมัติ, ไม่อนุมัติ, ส่งกลับแก้ไข} only
  return 'กำลังตรวจ'
}

// Parse structured tag in notes
export const parseReviewerNotes = (notesText: string) => {
  const scores: Record<string, 'pass' | 'fail' | 'na'> = {
    obj: 'pass',
    method: 'pass',
    privacy: 'pass',
    consent: 'pass',
    risk: 'pass',
    benefit: 'pass',
  }
  const revisionDetails: Record<string, string> = {
    obj: '',
    method: '',
    privacy: '',
    consent: '',
    risk: '',
    benefit: '',
  }
  let riskLevel = '1'
  let progressReportInterval = '12'
  let comments = notesText || ''

  const riskMatch = comments.match(/\[riskLevel:(1|2|3|4)\]/)
  if (riskMatch) {
    riskLevel = riskMatch[1]
    comments = comments.replace(/\[riskLevel:(?:1|2|3|4)\]\s*/, '')
  } else {
    const plainRisk = comments.match(/ระดับความเสี่ยง:\s*([1-4])/)
    if (plainRisk) riskLevel = plainRisk[1]
  }

  const intervalMatch = comments.match(/\[progressReportInterval:(6|12)\]/)
  if (intervalMatch) {
    progressReportInterval = intervalMatch[1]
    comments = comments.replace(/\[progressReportInterval:(?:6|12)\]\s*/, '')
  } else {
    const plainInt = comments.match(/ระยะเวลารายงานความก้าวหน้า:\s*(?:ทุก\s*)?(6|12)\s*เดือน/)
    if (plainInt) progressReportInterval = plainInt[1]
  }

  const revMatch = comments.match(/\[revisionDetails:([^\]]+)\]/)
  if (revMatch) {
    try {
      const decoded = JSON.parse(decodeURIComponent(revMatch[1]))
      Object.assign(revisionDetails, decoded)
    } catch {}
    comments = comments.replace(/\[revisionDetails:[^\]]+\]\s*/, '')
  }

  const match = comments.match(/\[obj:(pass|fail|na)\]\[method:(pass|fail|na)\]\[privacy:(pass|fail|na)\]\[consent:(pass|fail|na)\]\[risk:(pass|fail|na)\]\[benefit:(pass|fail|na)\]/)
  if (match) {
    scores.obj = match[1] as any
    scores.method = match[2] as any
    scores.privacy = match[3] as any
    scores.consent = match[4] as any
    scores.risk = match[5] as any
    scores.benefit = match[6] as any
    
    comments = comments.replace(/\[obj:(?:pass|fail|na)\]\[method:(?:pass|fail|na)\]\[privacy:(?:pass|fail|na)\]\[consent:(?:pass|fail|na)\]\[risk:(?:pass|fail|na)\]\[benefit:(?:pass|fail|na)\]\s*\n*/, '')
  }

  // Fallback parsing from text block if revision details / scores are present in text
  const keyMap: Record<string, string> = {
    '1': 'obj',
    '2': 'method',
    '3': 'privacy',
    '4': 'consent',
    '5': 'risk',
    '6': 'benefit',
  }

  const lines = (notesText || '').split('\n')
  for (const line of lines) {
    const m = line.match(/^(\d)\.\s*([^:]+):\s*(?:\[(ผ่าน|แก้ไข|ไม่เกี่ยวข้อง|pass|fail|na)\])?\s*(?:\((?:รายละเอียดการแก้ไข|ข้อเสนอแนะ):\s*(.*?)\))?$/)
    if (m) {
      const k = keyMap[m[1]]
      if (k) {
        if (m[3]) {
          if (m[3] === 'ผ่าน' || m[3] === 'pass') scores[k] = 'pass'
          else if (m[3] === 'แก้ไข' || m[3] === 'fail') scores[k] = 'fail'
          else if (m[3] === 'ไม่เกี่ยวข้อง' || m[3] === 'na') scores[k] = 'na'
        }
        if (m[4] && !revisionDetails[k]) {
          revisionDetails[k] = m[4].trim()
        }
      }
    }
  }

  comments = comments.replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*?===\s*(?:ความเห็นและข้อเสนอแนะเพิ่มเติม|ข้อเสนอแนะเพิ่มเติม)\s*===\s*\n*/, '')
  comments = comments.replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*$/, '')

  return { scores, revisionDetails, riskLevel, progressReportInterval, comments }
}

// Serialize checklist + comments to text format
export const serializeReviewerNotes = (
  scores: Record<string, 'pass' | 'fail' | 'na'>,
  comments: string,
  riskLevel: string = '1',
  progressReportInterval: string = '12',
  revisionDetails: Record<string, string> = {}
) => {
  const revJson = encodeURIComponent(JSON.stringify(revisionDetails))
  const structuredTag = `[riskLevel:${riskLevel}][progressReportInterval:${progressReportInterval}][revisionDetails:${revJson}][obj:${scores.obj}][method:${scores.method}][privacy:${scores.privacy}][consent:${scores.consent}][risk:${scores.risk}][benefit:${scores.benefit}]\n`
  
  const translateScore = (s: 'pass' | 'fail' | 'na') => {
    if (s === 'pass') return 'ผ่าน'
    return 'แก้ไข'
  }

  const riskLabel = RISK_LEVEL_OPTIONS.find(r => r.value === riskLevel)?.label || riskLevel
  const intervalLabel = REPORT_INTERVAL_OPTIONS.find(i => i.value === progressReportInterval)?.label || `${progressReportInterval} เดือน`

  const getRevNote = (key: string) => (revisionDetails[key] ? ` (รายละเอียดการแก้ไข: ${revisionDetails[key]})` : '')

  const readableCriteria = [
    `ระดับความเสี่ยง: ${riskLabel}`,
    `ระยะเวลารายงานความก้าวหน้า: ${intervalLabel}`,
    `1. วัตถุประสงค์และการออกแบบการวิจัย: [${translateScore(scores.obj)}]${getRevNote('obj')}`,
    `2. ความเหมาะสมของระเบียบวิธีวิจัยและกลุ่มตัวอย่าง: [${translateScore(scores.method)}]${getRevNote('method')}`,
    `3. การปกป้องสิทธิ์ ความเป็นส่วนตัว และข้อมูลส่วนบุคคล: [${translateScore(scores.privacy)}]${getRevNote('privacy')}`,
    `4. ความสมบูรณ์ของแบบชี้แจงและใบยินยอม (Informed Consent): [${translateScore(scores.consent)}]${getRevNote('consent')}`,
    `5. มาตรการป้องกันและลดความเสี่ยงต่ออาสาสมัคร: [${translateScore(scores.risk)}]${getRevNote('risk')}`,
    `6. สัดส่วนประโยชน์ที่ได้รับเทียบกับความเสี่ยงมีความเหมาะสม: [${translateScore(scores.benefit)}]${getRevNote('benefit')}`,
  ].join('\n')

  return `${structuredTag}=== ผลการประเมินรายเกณฑ์ ===\n${readableCriteria}\n\n=== ข้อเสนอแนะเพิ่มเติม ===\n${comments}`
}

interface ExportEvaluation {
  id: string
  submission_id: string
  reviewer_id: string
  status: string
  reviewer_notes: string | null
  created_at: string
  updated_at: string
}

// Generate printable/exportable PDF layout via html2pdf.js — Thai IRB official form style
// Renders one scorecard block per evaluation passed in `evaluations` and opens
// the generated PDF Blob directly in the browser's native PDF Viewer tab.
export const handleExportEvaluation = async (sub: any, submitterName: string, evaluations: ExportEvaluation[] = []) => {
  const translateScore = (s: string) => {
    if (s === 'pass') return '<strong>&#10003; ผ่าน</strong>'
    if (s === 'fail') return '<strong>&#10007; ต้องแก้ไข</strong>'
    return '<strong>- N/A</strong>'
  }

  const cleanNotesText = (notesText: string) => {
    let cleanNotes = notesText || ''
    cleanNotes = cleanNotes.replace(/\[riskLevel:(?:1|2|3|4)\]\s*/g, '')
    cleanNotes = cleanNotes.replace(/\[progressReportInterval:(?:6|12)\]\s*/g, '')
    cleanNotes = cleanNotes.replace(/\[revisionDetails:[^\]]+\]\s*/g, '')
    cleanNotes = cleanNotes.replace(/\[obj:(?:pass|fail|na)\]\[method:(?:pass|fail|na)\]\[privacy:(?:pass|fail|na)\]\[consent:(?:pass|fail|na)\]\[risk:(?:pass|fail|na)\]\[benefit:(?:pass|fail|na)\]\s*\n*/g, '')
    cleanNotes = cleanNotes.replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*?===\s*(?:ความเห็นและข้อเสนอแนะเพิ่มเติม|ข้อเสนอแนะเพิ่มเติม)\s*===\s*\n*/g, '')
    cleanNotes = cleanNotes.replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*$/g, '')
    cleanNotes = cleanNotes.replace(/===\s*(?:ความเห็นและข้อเสนอแนะเพิ่มเติม|ข้อเสนอแนะเพิ่มเติม)\s*===\s*\n*/g, '')
    cleanNotes = cleanNotes
      .replace(/\[.*?\]/g, '')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      .replace(/---/g, '\n')
      .trim()
    return cleanNotes
  }

  // Fall back to legacy single-evaluator source if no ethics_evaluations rows exist
  const evaluationSource = evaluations.length > 0
    ? evaluations
    : (sub.reviewer_notes ? [{ reviewer_notes: sub.reviewer_notes } as ExportEvaluation] : [])

  const evaluatorBlocks = evaluationSource.map((ev, idx) => {
    const parsed = parseReviewerNotes(ev.reviewer_notes || '')
    const cleanNotes = cleanNotesText(parsed.comments)
    return {
      index: idx,
      verdictLabel: ev.status ? translateEvaluationStatus(ev.status) : 'ยังไม่ได้ประเมิน',
      riskLabel: RISK_LEVEL_OPTIONS.find(r => r.value === parsed.riskLevel)?.label || 'ไม่เกินความเสี่ยงเล็กน้อย',
      intervalLabel: REPORT_INTERVAL_OPTIONS.find(i => i.value === parsed.progressReportInterval)?.label || 'ทุก 12 เดือน (1 ปี)',
      cleanNotes,
      criteria: [
        { label: '1. วัตถุประสงค์และการออกแบบการวิจัย', scoreHtml: translateScore(parsed.scores.obj), revisionDetail: parsed.revisionDetails?.obj },
        { label: '2. ความเหมาะสมของระเบียบวิธีวิจัยและกลุ่มตัวอย่าง', scoreHtml: translateScore(parsed.scores.method), revisionDetail: parsed.revisionDetails?.method },
        { label: '3. การปกป้องสิทธิ์ ความเป็นส่วนตัว และข้อมูลส่วนบุคคล', scoreHtml: translateScore(parsed.scores.privacy), revisionDetail: parsed.revisionDetails?.privacy },
        { label: '4. ความสมบูรณ์ของแบบชี้แจงและใบยินยอม (Informed Consent)', scoreHtml: translateScore(parsed.scores.consent), revisionDetail: parsed.revisionDetails?.consent },
        { label: '5. มาตรการป้องกันและลดความเสี่ยงต่ออาสาสมัคร', scoreHtml: translateScore(parsed.scores.risk), revisionDetail: parsed.revisionDetails?.risk },
        { label: '6. สัดส่วนประโยชน์ที่ได้รับเทียบกับความเสี่ยงมีความเหมาะสม', scoreHtml: translateScore(parsed.scores.benefit), revisionDetail: parsed.revisionDetails?.benefit },
      ],
    }
  })

  const statusLabel = sub.status === 'อนุมัติ'
    ? '☐ ไม่เห็นชอบ &nbsp;&nbsp;&nbsp; ☑ เห็นชอบ'
    : sub.status === 'ไม่อนุมัติ'
    ? '☑ ไม่เห็นชอบ &nbsp;&nbsp;&nbsp; ☐ เห็นชอบ'
    : '☐ ไม่เห็นชอบ &nbsp;&nbsp;&nbsp; ☐ เห็นชอบ'

  const today = new Date()
  const thaiDate = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const submittedDate = new Date(sub.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })

  const firstParsed = evaluationSource.length > 0 ? parseReviewerNotes(evaluationSource[0].reviewer_notes || '') : null
  const intervalMonths = parseInt(firstParsed?.progressReportInterval || '12')
  const expiryDate = new Date(today)
  expiryDate.setMonth(expiryDate.getMonth() + intervalMonths)
  const thaiExpiryDate = expiryDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0px'
  container.style.left = '0px'
  container.style.width = '794px'
  container.style.backgroundColor = '#ffffff'
  container.style.zIndex = '-9999'
  container.style.pointerEvents = 'none'
  container.innerHTML = buildDocumentHtml({
    thaiDate,
    submittedDate,
    thaiExpiryDate,
    projectTitle: sub.project_title,
    submitterName,
    statusLabel,
    evaluatorBlocks,
  })

  document.body.appendChild(container)

  try {
    if (document.fonts) {
      await document.fonts.ready
    }
    await new Promise((resolve) => setTimeout(resolve, 200))

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ])

    const pageElements = container.querySelectorAll<HTMLElement>('.pdf-page')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const marginX = 8
    const marginY = 8
    const imgWidth = pageWidth - (marginX * 2)

    for (let i = 0; i < pageElements.length; i++) {
      if (i > 0) {
        pdf.addPage()
      }
      const pageEl = pageElements[i]
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'JPEG', marginX, marginY, imgWidth, Math.min(imgHeight, pageHeight - (marginY * 2)))
    }

    const pdfBlob: Blob = pdf.output('blob')
    const blobUrl = URL.createObjectURL(pdfBlob)
    window.open(blobUrl, '_blank')
  } catch (err) {
    console.error('Error generating PDF with html2canvas/jsPDF:', err)
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}

const CATEGORY_OPTIONS: { value: 'ethics' | 'ip' | 'utilization'; label: string; badgeClass: string }[] = [
  { value: 'ethics', label: 'จริยธรรมการวิจัย (Ethics)', badgeClass: 'bg-[#F3E8FF] text-[#7C3AED] border-[#DDD6FE]' },
  { value: 'ip', label: 'ทรัพย์สินทางปัญญา (IP)', badgeClass: 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]' },
  { value: 'utilization', label: 'การนำผลงานวิจัยไปใช้ประโยชน์ (Utilization)', badgeClass: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]' },
]

const categoryLabel = (cat: string) => CATEGORY_OPTIONS.find((c) => c.value === cat)?.label || cat
const categoryBadgeClass = (cat: string) => CATEGORY_OPTIONS.find((c) => c.value === cat)?.badgeClass || 'bg-slate-100 text-slate-600 border-slate-200'

interface EthicsTabProps {
  newFormTitle: string
  setNewFormTitle: (value: string) => void
  newFormCat: 'ethics' | 'ip' | 'utilization'
  setNewFormCat: (value: 'ethics' | 'ip' | 'utilization') => void
  newFormUrl: string
  setNewFormUrl: (value: string) => void
  onAddDownloadableForm: (e: React.FormEvent, urlOverride?: string) => void
  downloadableForms: any[]
  onDeleteDownloadableForm: (id: string) => void
  uploadFile: (file: File, folder: string, isPublic: boolean) => Promise<string>
}

export const EthicsTab: React.FC<EthicsTabProps> = ({
  newFormTitle, setNewFormTitle, newFormCat, setNewFormCat, newFormUrl, setNewFormUrl,
  onAddDownloadableForm, downloadableForms, onDeleteDownloadableForm, uploadFile,
}) => {
  const [formSearch, setFormSearch] = useState('')
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [addSourceType, setAddSourceType] = useState<'link' | 'upload'>('link')
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addUploading, setAddUploading] = useState(false)

  // Edit Form States
  const [editingForm, setEditingForm] = useState<any | null>(null)
  const [editFormTitle, setEditFormTitle] = useState('')
  const [editFormCat, setEditFormCat] = useState<'ethics' | 'ip' | 'utilization'>('ethics')
  const [editFormUrl, setEditFormUrl] = useState('')
  const [editSourceType, setEditSourceType] = useState<'link' | 'upload'>('link')
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editUploading, setEditUploading] = useState(false)

  const filteredForms = formSearch.trim()
    ? downloadableForms.filter((form) =>
        form.title.toLowerCase().includes(formSearch.toLowerCase())
      )
    : downloadableForms

  const formColumns: DataTableColumn<any>[] = [
    {
      key: 'title',
      header: 'ชื่อเอกสาร / แบบฟอร์ม',
      render: (form) => <span className="font-bold text-slate-850">{form.title}</span>
    },
    {
      key: 'category',
      header: 'หมวดหมู่',
      render: (form) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${categoryBadgeClass(form.category)}`}>
          {categoryLabel(form.category)}
        </span>
      )
    },
    {
      key: 'file_url',
      header: 'ลิงก์ดาวน์โหลด',
      render: (form) => (
        <a
          href={getMediaUrl(form.file_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          เปิดไฟล์แนบ
        </a>
      )
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (form) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setEditingForm(form)
              setEditFormTitle(form.title)
              setEditFormCat(form.category)
              setEditFormUrl(form.file_url)
              setEditSourceType('link')
              setEditFile(null)
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
          >
            <Edit2 className="w-3 h-3" />
            แก้ไข
          </button>
          <button
            onClick={() => onDeleteDownloadableForm(form.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#FFF1F2', color: '#9F1239', borderColor: '#FECDD3' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            ลบ
          </button>
        </div>
      )
    }
  ]

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (addSourceType === 'upload') {
      if (!addFile) return
      setAddUploading(true)
      try {
        const path = await uploadFile(addFile, 'downloadable-forms', true)
        setNewFormUrl(path)
        onAddDownloadableForm(e, path)
      } finally {
        setAddUploading(false)
      }
    } else {
      onAddDownloadableForm(e)
    }
    setIsAddFormOpen(false)
    setAddFile(null)
    setAddSourceType('link')
  }

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Forms List */}
      <DataTable
        badge="เอกสารประกอบ"
        title="แบบฟอร์มดาวน์โหลดและเอกสารประกอบ"
        actionButton={{
          label: 'เพิ่มแบบฟอร์มดาวน์โหลด',
          onClick: () => setIsAddFormOpen(true),
          icon: <Plus className="w-4 h-4" />
        }}
        searchPlaceholder="ค้นหาแบบฟอร์มดาวน์โหลด..."
        searchValue={formSearch}
        onSearchChange={setFormSearch}
        columns={formColumns}
        data={filteredForms}
        getRowKey={(form) => form.id}
        empty={{
          icon: <Clipboard className="w-9 h-9 stroke-[1.5]" />,
          title: 'ไม่มีแบบฟอร์มดาวน์โหลดในระบบ',
          dashed: true
        }}
      />

      {/* Add Form Dialog */}
      <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
        <DialogContent className="max-w-[480px] w-full p-6 space-y-4 rounded-2xl shadow-2xl border border-slate-200 animate-fadeIn">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>แบบฟอร์มดาวน์โหลด</p>
            <DialogTitle className="text-sm font-black text-slate-900 leading-snug">
              เพิ่มแบบฟอร์มดาวน์โหลดใหม่
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              ข้อความนี้จะแสดงในเมนูเอกสารดาวน์โหลดสำหรับผู้ใช้ทั่วไป
            </DialogDescription>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-500 mb-1">ชื่อเอกสาร / แบบฟอร์ม *</label>
              <Input
                type="text"
                required
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                placeholder="เช่น แบบฟอร์มขอรับการพิจารณาจริยธรรม..."
                className="w-full light-input text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">หมวดหมู่เอกสาร *</label>
              <select
                value={newFormCat}
                onChange={(e) => setNewFormCat(e.target.value as 'ethics' | 'ip' | 'utilization')}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">แหล่งที่มาของเอกสาร *</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setAddSourceType('link')}
                  className="flex-1 h-9 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer"
                  style={addSourceType === 'link' ? { background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' } : { background: '#fff', color: '#475569', borderColor: '#E2E8F0' }}
                >
                  แปะลิงก์
                </button>
                <button
                  type="button"
                  onClick={() => setAddSourceType('upload')}
                  className="flex-1 h-9 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer"
                  style={addSourceType === 'upload' ? { background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' } : { background: '#fff', color: '#475569', borderColor: '#E2E8F0' }}
                >
                  อัพโหลดไฟล์
                </button>
              </div>
              {addSourceType === 'link' ? (
                <Input
                  type="url"
                  required
                  value={newFormUrl}
                  onChange={(e) => setNewFormUrl(e.target.value)}
                  placeholder="https://example.com/form.pdf"
                  className="w-full light-input text-xs"
                />
              ) : (
                <input
                  type="file"
                  required
                  onChange={(e) => setAddFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:h-9 file:px-4 file:rounded-xl file:border-0 file:bg-[#F0F7FF] file:text-[#0EA5A0] file:text-xs file:font-bold file:cursor-pointer"
                />
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={addUploading}
                className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none disabled:opacity-60"
                style={{ background: '#0EA5A0' }}
              >
                {addUploading ? 'กำลังอัพโหลด...' : 'บันทึกแบบฟอร์ม'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog open={!!editingForm} onOpenChange={(open) => !open && setEditingForm(null)}>
        <DialogContent className="max-w-[480px] w-full p-6 space-y-4 rounded-2xl shadow-2xl border border-slate-200 animate-fadeIn">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>แบบฟอร์มดาวน์โหลด</p>
            <DialogTitle className="text-sm font-black text-slate-900 leading-snug">
              แก้ไขแบบฟอร์มดาวน์โหลด
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              แก้ไขรายละเอียดและลิงก์เอกสารของแบบฟอร์มดาวน์โหลด
            </DialogDescription>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!editingForm || !editFormTitle) return
              if (editSourceType === 'link' && !editFormUrl) return
              if (editSourceType === 'upload' && !editFile) return
              try {
                let fileUrl = editFormUrl
                if (editSourceType === 'upload' && editFile) {
                  setEditUploading(true)
                  fileUrl = await uploadFile(editFile, 'downloadable-forms', true)
                }
                const { error } = await supabase.from('downloadable_forms').update({
                  title: editFormTitle,
                  category: editFormCat,
                  file_url: fileUrl
                }).eq('id', editingForm.id)
                if (error) throw error
                setEditingForm(null)
              } catch (err: any) {
                console.error('Error updating downloadable form:', err)
              } finally {
                setEditUploading(false)
              }
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-500 mb-1">ชื่อเอกสาร / แบบฟอร์ม *</label>
              <Input
                type="text"
                required
                value={editFormTitle}
                onChange={(e) => setEditFormTitle(e.target.value)}
                placeholder="เช่น แบบฟอร์มขอรับการพิจารณาจริยธรรม..."
                className="w-full light-input text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">หมวดหมู่เอกสาร *</label>
              <select
                value={editFormCat}
                onChange={(e) => setEditFormCat(e.target.value as 'ethics' | 'ip' | 'utilization')}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">แหล่งที่มาของเอกสาร *</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setEditSourceType('link')}
                  className="flex-1 h-9 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer"
                  style={editSourceType === 'link' ? { background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' } : { background: '#fff', color: '#475569', borderColor: '#E2E8F0' }}
                >
                  แปะลิงก์
                </button>
                <button
                  type="button"
                  onClick={() => setEditSourceType('upload')}
                  className="flex-1 h-9 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer"
                  style={editSourceType === 'upload' ? { background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' } : { background: '#fff', color: '#475569', borderColor: '#E2E8F0' }}
                >
                  อัพโหลดไฟล์
                </button>
              </div>
              {editSourceType === 'link' ? (
                <Input
                  type="url"
                  required
                  value={editFormUrl}
                  onChange={(e) => setEditFormUrl(e.target.value)}
                  placeholder="https://example.com/form.pdf"
                  className="w-full light-input text-xs"
                />
              ) : (
                <input
                  type="file"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:h-9 file:px-4 file:rounded-xl file:border-0 file:bg-[#F0F7FF] file:text-[#0EA5A0] file:text-xs file:font-bold file:cursor-pointer"
                />
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingForm(null)}
                className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={editUploading}
                className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none disabled:opacity-60"
                style={{ background: '#0EA5A0' }}
              >
                {editUploading ? 'กำลังอัพโหลด...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
