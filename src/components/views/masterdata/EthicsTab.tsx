'use client'

import React, { useState } from 'react'
import { Clipboard, Edit2, Trash2, ExternalLink, Plus } from 'lucide-react'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase, getMediaUrl } from '@/services/supabase'

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
  let riskLevel = '1'
  let progressReportInterval = '12'
  let comments = notesText

  const riskMatch = comments.match(/\[riskLevel:(1|2|3|4)\]/)
  if (riskMatch) {
    riskLevel = riskMatch[1]
    comments = comments.replace(/\[riskLevel:(?:1|2|3|4)\]\s*/, '')
  }

  const intervalMatch = comments.match(/\[progressReportInterval:(6|12)\]/)
  if (intervalMatch) {
    progressReportInterval = intervalMatch[1]
    comments = comments.replace(/\[progressReportInterval:(?:6|12)\]\s*/, '')
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
    comments = comments.replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*?=== ความเห็นและข้อเสนอแนะเพิ่มเติม ===\s*\n*/, '')
  }
  return { scores, riskLevel, progressReportInterval, comments }
}

// Serialize checklist + comments to text format
export const serializeReviewerNotes = (
  scores: Record<string, 'pass' | 'fail' | 'na'>,
  comments: string,
  riskLevel: string = '1',
  progressReportInterval: string = '12'
) => {
  const structuredTag = `[riskLevel:${riskLevel}][progressReportInterval:${progressReportInterval}][obj:${scores.obj}][method:${scores.method}][privacy:${scores.privacy}][consent:${scores.consent}][risk:${scores.risk}][benefit:${scores.benefit}]\n`
  
  const translateScore = (s: 'pass' | 'fail' | 'na') => {
    if (s === 'pass') return 'ผ่าน'
    if (s === 'fail') return 'ต้องแก้ไข'
    return 'ไม่เกี่ยวข้อง'
  }

  const riskLabel = RISK_LEVEL_OPTIONS.find(r => r.value === riskLevel)?.label || riskLevel
  const intervalLabel = REPORT_INTERVAL_OPTIONS.find(i => i.value === progressReportInterval)?.label || `${progressReportInterval} เดือน`

  const readableCriteria = [
    `ระดับความเสี่ยง: ${riskLabel}`,
    `ระยะเวลารายงานความก้าวหน้า: ${intervalLabel}`,
    `1. วัตถุประสงค์และการออกแบบการวิจัย: [${translateScore(scores.obj)}]`,
    `2. ความเหมาะสมของระเบียบวิธีวิจัยและกลุ่มตัวอย่าง: [${translateScore(scores.method)}]`,
    `3. การปกป้องสิทธิ์ ความเป็นส่วนตัว และข้อมูลส่วนบุคคล: [${translateScore(scores.privacy)}]`,
    `4. ความสมบูรณ์ของแบบชี้แจงและใบยินยอม (Informed Consent): [${translateScore(scores.consent)}]`,
    `5. มาตรการป้องกันและลดความเสี่ยงต่ออาสาสมัคร: [${translateScore(scores.risk)}]`,
    `6. สัดส่วนประโยชน์ที่ได้รับเทียบกับความเสี่ยงมีความเหมาะสม: [${translateScore(scores.benefit)}]`,
  ].join('\n')

  return `${structuredTag}=== ผลการประเมินรายเกณฑ์ ===\n${readableCriteria}\n\n=== ความเห็นและข้อเสนอแนะเพิ่มเติม ===\n${comments}`
}

// Generate printable/exportable PDF layout window — Thai IRB official form style (Anonymous Expert Evaluation)
export const handleExportEvaluation = (sub: any, submitterName: string) => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const parsed = parseReviewerNotes(sub.reviewer_notes || '')
  let cleanNotes = parsed.comments

  const translateScore = (s: string) => {
    if (s === 'pass') return '<span style="color:#16a34a;font-weight:700;">✓ ผ่าน</span>'
    if (s === 'fail') return '<span style="color:#b45309;font-weight:700;">✗ ต้องแก้ไข</span>'
    return '<span style="color:#64748b;font-weight:700;">- N/A (ไม่เกี่ยวข้อง)</span>'
  }


  const riskLabel = RISK_LEVEL_OPTIONS.find(r => r.value === parsed.riskLevel)?.label || 'ไม่เกินความเสี่ยงเล็กน้อย'
  const intervalLabel = REPORT_INTERVAL_OPTIONS.find(i => i.value === parsed.progressReportInterval)?.label || 'ทุก 12 เดือน (1 ปี)'

  const criteria = [
    { label: '1. วัตถุประสงค์และการออกแบบการวิจัย', val: parsed.scores.obj },
    { label: '2. ความเหมาะสมของระเบียบวิธีวิจัยและกลุ่มตัวอย่าง', val: parsed.scores.method },
    { label: '3. การปกป้องสิทธิ์ ความเป็นส่วนตัว และข้อมูลส่วนบุคคล', val: parsed.scores.privacy },
    { label: '4. ความสมบูรณ์ของแบบชี้แจงและใบยินยอม (Informed Consent)', val: parsed.scores.consent },
    { label: '5. มาตรการป้องกันและลดความเสี่ยงต่ออาสาสมัคร', val: parsed.scores.risk },
    { label: '6. สัดส่วนประโยชน์ที่ได้รับเทียบกับความเสี่ยงมีความเหมาะสม', val: parsed.scores.benefit },
  ]

  cleanNotes = cleanNotes.replace(/\[riskLevel:(?:1|2|3|4)\]\s*/, '')
  cleanNotes = cleanNotes.replace(/\[progressReportInterval:(?:6|12)\]\s*/, '')
  cleanNotes = cleanNotes.replace(/\[obj:(?:pass|fail|na)\]\[method:(?:pass|fail|na)\]\[privacy:(?:pass|fail|na)\]\[consent:(?:pass|fail|na)\]\[risk:(?:pass|fail|na)\]\[benefit:(?:pass|fail|na)\]\s*\n*/, '')
  cleanNotes = cleanNotes.replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*?=== ความเห็นและข้อเสนอแนะเพิ่มเติม ===\s*\n*/, '')
  cleanNotes = cleanNotes.replace(/\[ผู้ทรงคุณวุฒิท่านที่ 1\]/g, '').replace(/\[ผู้ทรงคุณวุฒิท่านที่ 2\]/g, '\n').replace(/---/g, '\n').trim()

  const statusLabel = sub.status === 'อนุมัติ'
    ? '☐ ไม่เห็นชอบ &nbsp;&nbsp;&nbsp; ☑ เห็นชอบ &nbsp;&nbsp;&nbsp; ☐ เห็นชอบ หากแก้ไขตามข้อเสนอแนะ'
    : sub.status === 'รอแก้ไข'
    ? '☐ ไม่เห็นชอบ &nbsp;&nbsp;&nbsp; ☐ เห็นชอบ &nbsp;&nbsp;&nbsp; ☑ เห็นชอบ หากแก้ไขตามข้อเสนอแนะ'
    : sub.status === 'ไม่อนุมัติ'
    ? '☑ ไม่เห็นชอบ &nbsp;&nbsp;&nbsp; ☐ เห็นชอบ &nbsp;&nbsp;&nbsp; ☐ เห็นชอบ หากแก้ไขตามข้อเสนอแนะ'
    : '☐ ไม่เห็นชอบ &nbsp;&nbsp;&nbsp; ☐ เห็นชอบ &nbsp;&nbsp;&nbsp; ☐ เห็นชอบ หากแก้ไขตามข้อเสนอแนะ'

  const today = new Date()
  const thaiDate = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const submittedDate = new Date(sub.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })

  // Calculate expiry for reporting: interval months from today
  const intervalMonths = parseInt(parsed.progressReportInterval || '12')
  const expiryDate = new Date(today)
  expiryDate.setMonth(expiryDate.getMonth() + intervalMonths)
  const thaiExpiryDate = expiryDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })

  const criTableRows = criteria.map((c) => `
    <tr>
      <td style="border:1px solid #000;padding:6px 10px;font-size:13px;">${c.label}</td>
      <td style="border:1px solid #000;padding:6px 10px;text-align:center;font-size:13px;">${translateScore(c.val)}</td>
    </tr>`).join('')

  const docHtml = `<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"/>
<title>แบบประเมินโครงร่างวิจัย — ${sub.project_title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Sarabun', 'TH Sarabun New', serif; font-size: 14px; color: #000; background: #fff; padding: 30px 40px; line-height: 1.7; }
.page { max-width: 740px; margin: 0 auto; }
.doc-header { text-align: center; margin-bottom: 18px; }
.doc-header .org-name { font-size: 18px; font-weight: 800; }
.doc-header .org-sub { font-size: 14px; }
.doc-header .form-title { font-size: 16px; font-weight: 700; margin-top: 8px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 0; }
.ref-row { display: flex; justify-content: space-between; font-size: 13px; margin: 10px 0 6px 0; }
.info-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
.info-table td { padding: 5px 8px; font-size: 13px; vertical-align: top; }
.info-table .lbl { width: 200px; font-weight: 700; }
.underline-fill { border-bottom: 1px solid #555; display: inline-block; min-width: 260px; padding: 0 4px; }
.section-title { font-weight: 700; font-size: 14px; margin: 16px 0 6px 0; border-bottom: 1px solid #000; padding-bottom: 3px; }
.criteria-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
.criteria-table th { border: 1px solid #000; padding: 6px 10px; font-size: 13px; background: #f0f0f0; text-align: center; }
.criteria-table td { border: 1px solid #000; padding: 6px 10px; font-size: 13px; }
.risk-box { border: 1px solid #000; padding: 8px 12px; margin: 10px 0; font-size: 13px; }
.checkbox-row { font-size: 13px; margin: 6px 0; }
.notes-box { border: 1px solid #555; min-height: 80px; padding: 8px 12px; font-size: 13px; white-space: pre-wrap; margin-top: 4px; }
.sign-section { margin-top: 40px; display: flex; justify-content: flex-end; }
.sign-block { width: 280px; text-align: center; }
.sign-line { border-bottom: 1px solid #000; margin: 60px auto 6px; width: 85%; }
.sign-label { font-size: 13px; font-weight: 500; }
.footer-note { font-size: 11px; color: #555; margin-top: 25px; border-top: 1px dashed #999; padding-top: 8px; }
@media print { body { padding: 10px 20px; } .no-print { display: none; } }
</style>
</head><body>
<div class="page">

  <!-- Print Button -->
  <div class="no-print" style="text-align:right;margin-bottom:12px;">
    <button onclick="window.print()" style="padding:8px 20px;font-family:inherit;font-size:13px;font-weight:700;background:#0B1D3A;color:#fff;border:none;border-radius:6px;cursor:pointer;">🖨 พิมพ์ / บันทึก PDF</button>
  </div>

  <!-- Header -->
  <div class="doc-header">
    <div class="org-name">วิทยาลัยพยาบาลศรีมหาสารคาม</div>
    <div class="org-sub">สถาบันพระบรมราชชนก กระทรวงสาธารณสุข</div>
    <div class="form-title">แบบประเมินโครงร่างวิจัย<br/>คณะกรรมการจริยธรรมการวิจัยในมนุษย์ (IRB)</div>
  </div>

  <!-- Reference / Date -->
  <div class="ref-row">
    <span>เลขที่หนังสือ: <span class="underline-fill">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span>
    <span>วันที่ประเมิน: <strong>${thaiDate}</strong></span>
  </div>

  <!-- Project Info -->
  <div class="section-title">ข้อมูลโครงการวิจัย</div>
  <table class="info-table">
    <tr><td class="lbl">ชื่อโครงการวิจัย:</td><td><strong>${sub.project_title}</strong></td></tr>
    <tr><td class="lbl">ผู้วิจัย / ผู้ยื่นคำขอ:</td><td>${submitterName}</td></tr>
    <tr><td class="lbl">วันที่ยื่นคำขอ:</td><td>${submittedDate}</td></tr>
  </table>

  <!-- Risk Level -->
  <div class="section-title">ระดับความเสี่ยงของโครงการ</div>
  <div class="risk-box">
    <div>☑ ${riskLabel}</div>
  </div>

  <!-- Reporting Cycle -->
  <div class="section-title">กำหนดรายงานความก้าวหน้า</div>
  <div class="risk-box">
    รายงานความก้าวหน้า: <strong>${intervalLabel}</strong>
    &nbsp;&nbsp;|&nbsp;&nbsp; กำหนดส่งรายงานฉบับต่อไป: <strong>${thaiExpiryDate}</strong>
  </div>

  <!-- Criteria Checklist -->
  <div class="section-title">เกณฑ์การพิจารณาจริยธรรมการวิจัย</div>
  <table class="criteria-table">
    <thead>
      <tr>
        <th style="width:75%;text-align:left;">เกณฑ์การพิจารณา</th>
        <th style="width:25%;">ผลการพิจารณา</th>
      </tr>
    </thead>
    <tbody>${criTableRows}</tbody>
  </table>

  <!-- Feedback / Comments -->
  <div class="section-title">ข้อเสนอแนะเพิ่มเติมจากคณะกรรมการประเมิน</div>
  <div class="notes-box">${(cleanNotes || 'ไม่มีข้อเสนอแนะเพิ่มเติม').replace(/\n/g, '<br/>')}</div>

  <!-- Conclusion -->
  <div class="section-title">ผลการพิจารณาโดยรวม</div>
  <div class="checkbox-row" style="font-size:14px;padding:8px 0;">${statusLabel}</div>

  <!-- Signature (IRB Board Chairman only) -->
  <div class="sign-section">
    <div class="sign-block">
      <div class="sign-line"></div>
      <div class="sign-label">ประธานคณะกรรมการ IRB</div>
      <div class="sign-label">วันที่ .................</div>
    </div>
  </div>

  <div class="footer-note">
    พิมพ์จากระบบคลังปัญญา SMNC — วิทยาลัยพยาบาลศรีมหาสารคาม | วันที่พิมพ์: ${thaiDate}
  </div>
</div>
<script>
window.onload = function() { setTimeout(function() { window.print(); }, 800); }
</script>
</body></html>`

  printWindow.document.write(docHtml)
  printWindow.document.close()
  printWindow.focus()
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
