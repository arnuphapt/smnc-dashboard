import React, { useState } from 'react'
import { Trash2, ExternalLink, Clipboard, FileText, UserCheck, Shield, Plus } from 'lucide-react'
import { DataTableColumn } from '../../components/DataTable'
import { MasterDataTable } from '../../components/MasterDataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { SidePanel, FieldLabel } from '../../components/SidePanel'
import { Profile } from '../../context/AuthContext'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const NO_REVIEWER = '__none__'

// Core research ethics criteria checklist
export const EVALUATION_CRITERIA = [
  { key: 'obj', label: '1. วัตถุประสงค์และการออกแบบการวิจัย' },
  { key: 'method', label: '2. ความเหมาะสมของระเบียบวิธีวิจัยและกลุ่มตัวอย่าง' },
  { key: 'privacy', label: '3. การปกป้องสิทธิ์ ความเป็นส่วนตัว และข้อมูลส่วนบุคคล' },
  { key: 'consent', label: '4. ความสมบูรณ์ของแบบชี้แจงและใบยินยอม (Informed Consent)' },
  { key: 'risk', label: '5. มาตรการป้องกันและลดความเสี่ยงต่ออาสาสมัคร' },
  { key: 'benefit', label: '6. สัดส่วนประโยชน์ที่ได้รับเทียบกับความเสี่ยงมีความเหมาะสม' },
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
  let comments = notesText

  const match = notesText.match(/\[obj:(pass|fail|na)\]\[method:(pass|fail|na)\]\[privacy:(pass|fail|na)\]\[consent:(pass|fail|na)\]\[risk:(pass|fail|na)\]\[benefit:(pass|fail|na)\]/)
  if (match) {
    scores.obj = match[1] as any
    scores.method = match[2] as any
    scores.privacy = match[3] as any
    scores.consent = match[4] as any
    scores.risk = match[5] as any
    scores.benefit = match[6] as any
    
    // Extract actual comments section after the tag and criteria table
    comments = notesText.replace(/\[obj:(?:pass|fail|na)\]\[method:(?:pass|fail|na)\]\[privacy:(?:pass|fail|na)\]\[consent:(?:pass|fail|na)\]\[risk:(?:pass|fail|na)\]\[benefit:(?:pass|fail|na)\]\s*\n*/, '')
    comments = comments.replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*?=== ความเห็นและข้อเสนอแนะเพิ่มเติม ===\s*\n*/, '')
  }
  return { scores, comments }
}

// Serialize checklist + comments to text format
export const serializeReviewerNotes = (scores: Record<string, 'pass' | 'fail' | 'na'>, comments: string) => {
  const structuredTag = `[obj:${scores.obj}][method:${scores.method}][privacy:${scores.privacy}][consent:${scores.consent}][risk:${scores.risk}][benefit:${scores.benefit}]\n`
  
  const translateScore = (s: 'pass' | 'fail' | 'na') => {
    if (s === 'pass') return 'ผ่าน'
    if (s === 'fail') return 'ต้องแก้ไข'
    return 'ไม่เกี่ยวข้อง'
  }

  const readableCriteria = [
    `1. วัตถุประสงค์และการออกแบบการวิจัย: [${translateScore(scores.obj)}]`,
    `2. ความเหมาะสมของระเบียบวิธีวิจัยและกลุ่มตัวอย่าง: [${translateScore(scores.method)}]`,
    `3. การปกป้องสิทธิ์ ความเป็นส่วนตัว และข้อมูลส่วนบุคคล: [${translateScore(scores.privacy)}]`,
    `4. ความสมบูรณ์ของแบบชี้แจงและใบยินยอม (Informed Consent): [${translateScore(scores.consent)}]`,
    `5. มาตรการป้องกันและลดความเสี่ยงต่ออาสาสมัคร: [${translateScore(scores.risk)}]`,
    `6. สัดส่วนประโยชน์ที่ได้รับเทียบกับความเสี่ยงมีความเหมาะสม: [${translateScore(scores.benefit)}]`,
  ].join('\n')

  return `${structuredTag}=== ผลการประเมินรายเกณฑ์ ===\n${readableCriteria}\n\n=== ความเห็นและข้อเสนอแนะเพิ่มเติม ===\n${comments}`
}

// Generate printable/exportable PDF layout window
export const handleExportEvaluation = (sub: any, reviewerName: string, submitterEmail: string) => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  let cleanNotes = sub.reviewer_notes || ''
  let checklistHtml = ''

  const match = cleanNotes.match(/\[obj:(pass|fail|na)\]\[method:(pass|fail|na)\]\[privacy:(pass|fail|na)\]\[consent:(pass|fail|na)\]\[risk:(pass|fail|na)\]\[benefit:(pass|fail|na)\]/)
  if (match) {
    const translateScore = (s: string) => {
      if (s === 'pass') return '<span style="color: #16a34a; font-weight: bold;">✔ ผ่าน</span>'
      if (s === 'fail') return '<span style="color: #d97706; font-weight: bold;">⚠ ต้องแก้ไข</span>'
      return '<span style="color: #64748b; font-style: italic;">N/A ไม่เกี่ยวข้อง</span>'
    }

    const criteria = [
      { label: '1. วัตถุประสงค์และการออกแบบการวิจัย', val: match[1] },
      { label: '2. ความเหมาะสมของระเบียบวิธีวิจัยและกลุ่มตัวอย่าง', val: match[2] },
      { label: '3. การปกป้องสิทธิ์ ความเป็นส่วนตัว และข้อมูลส่วนบุคคล', val: match[3] },
      { label: '4. ความสมบูรณ์ของแบบชี้แจงและใบยินยอม (Informed Consent)', val: match[4] },
      { label: '5. มาตรการป้องกันและลดความเสี่ยงต่ออาสาสมัคร', val: match[5] },
      { label: '6. สัดส่วนประโยชน์ที่ได้รับเทียบกับความเสี่ยงมีความเหมาะสม', val: match[6] }
    ]

    checklistHtml = `
      <h3 style="font-size: 14px; color: #0B1D3A; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">ผลการประเมินรายเกณฑ์จริยธรรม</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; text-align: left;">
            <th style="padding: 8px 10px; font-weight: 700; color: #475569;">เกณฑ์การพิจารณาจริยธรรม</th>
            <th style="padding: 8px 10px; font-weight: 700; color: #475569; width: 120px; text-align: center;">ผลการประเมิน</th>
          </tr>
        </thead>
        <tbody>
          ${criteria.map(c => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 10px; color: #334155;">${c.label}</td>
              <td style="padding: 8px 10px; text-align: center;">${translateScore(c.val)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    cleanNotes = cleanNotes.replace(/\[obj:(?:pass|fail|na)\]\[method:(?:pass|fail|na)\]\[privacy:(?:pass|fail|na)\]\[consent:(?:pass|fail|na)\]\[risk:(?:pass|fail|na)\]\[benefit:(?:pass|fail|na)\]\s*\n*/, '')
    cleanNotes = cleanNotes.replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*?=== ความเห็นและข้อเสนอแนะเพิ่มเติม ===\s*\n*/, '')
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>รายงานผลการพิจารณาจริยธรรมการวิจัย - ${sub.project_title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700;800&display=swap');
          body {
            font-family: 'Sarabun', sans-serif;
            padding: 40px;
            color: #1e293b;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0EA5A0;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .logo {
            font-size: 22px;
            font-weight: 800;
            color: #0B1D3A;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 13px;
            color: #64748B;
          }
          .title {
            font-size: 16px;
            font-weight: 700;
            margin-top: 15px;
            color: #0B1D3A;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 6px 15px;
            margin-bottom: 25px;
            font-size: 12px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          .meta-label {
            font-weight: 700;
            color: #475569;
          }
          .notes-container {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            font-size: 13px;
            white-space: pre-wrap;
            color: #334155;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">คลังปัญญา SMNC</div>
          <div class="subtitle">สถาบันวิจัยและนวัตกรรมทางการพยาบาล วิทยาลัยพยาบาลศรีมหาสารคาม</div>
          <div class="title">รายงานผลการประเมินและข้อเสนอแนะจริยธรรมการวิจัย</div>
        </div>

        <div class="meta-grid">
          <div class="meta-label">ชื่อโครงการวิจัย:</div>
          <div style="font-weight: 700;">${sub.project_title}</div>
          <div class="meta-label">ผู้ยื่นคำขอ:</div>
          <div>${submitterEmail}</div>
          <div class="meta-label">ผู้ทรงคุณวุฒิ:</div>
          <div>${reviewerName || 'ผู้ทรงคุณวุฒิในระบบ'}</div>
          <div class="meta-label">สถานะผลการประเมิน:</div>
          <div style="font-weight: 700; color: ${sub.status === 'อนุมัติ' ? '#16a34a' : sub.status === 'รอแก้ไข' ? '#b45309' : '#475569'}">${sub.status}</div>
          <div class="meta-label">วันที่พิมพ์เอกสาร:</div>
          <div>${new Date().toLocaleDateString('th-TH')}</div>
        </div>

        ${checklistHtml}

        <h3 style="font-size: 14px; color: #0B1D3A; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">ความเห็นและข้อเสนอแนะเพิ่มเติม</h3>
        <div class="notes-container">${cleanNotes.trim() || 'ไม่มีข้อเสนอแนะเพิ่มเติม'}</div>

        <div class="footer">
          เอกสารนี้จัดทำโดยระบบงานจริยธรรมการวิจัย คลังปัญญา SMNC (วิทยาลัยพยาบาลศรีมหาสารคาม)<br/>
          พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

interface EthicsTabProps {
  newFormTitle: string
  setNewFormTitle: (value: string) => void
  newFormCat: 'ethics' | 'ip'
  setNewFormCat: (value: 'ethics' | 'ip') => void
  newFormUrl: string
  setNewFormUrl: (value: string) => void
  onAddDownloadableForm: (e: React.FormEvent) => void
  downloadableForms: any[]
  onDeleteDownloadableForm: (id: string) => void

  ethicsSubmissions: any[]
  profiles: Profile[]
  attachments: any[]
  onDownloadPrivateFile: (path: string) => void

  subEditing: any | null
  setSubEditing: (sub: any | null) => void
  subReviewerInput: string
  setSubReviewerInput: (value: string) => void
  subStatusInput: string
  setSubStatusInput: (value: string) => void
  subNotesInput: string
  setSubNotesInput: (value: string) => void
  onUpdateSubmission: (id: string, reviewerId: string | null, status: string, notes: string) => void
}

export const EthicsTab: React.FC<EthicsTabProps> = ({
  newFormTitle, setNewFormTitle, newFormCat, setNewFormCat, newFormUrl, setNewFormUrl,
  onAddDownloadableForm, downloadableForms, onDeleteDownloadableForm,
  ethicsSubmissions, profiles, attachments, onDownloadPrivateFile,
  subEditing, setSubEditing, subReviewerInput, setSubReviewerInput,
  subStatusInput, setSubStatusInput, subNotesInput, setSubNotesInput, onUpdateSubmission,
}) => {
  const ethicsForms = downloadableForms.filter((f) => f.category === 'ethics')

  // Evaluation Checklist state
  const [scores, setScores] = useState<Record<string, 'pass' | 'fail' | 'na'>>({
    obj: 'pass',
    method: 'pass',
    privacy: 'pass',
    consent: 'pass',
    risk: 'pass',
    benefit: 'pass',
  })

  const columns: DataTableColumn<any>[] = [
    {
      key: 'submitter',
      header: 'ผู้ยื่นคำขอ',
      render: (sub) => {
        const submitter = profiles.find((p) => p.id === sub.submitter_id)
        return (
          <>
            <div className="font-bold" style={{ color: '#0B1D3A' }}>{submitter?.email || 'ไม่ระบุผู้ใช้'}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">🗓️ ยื่นเมื่อ: {new Date(sub.created_at).toLocaleDateString('th-TH')}</p>
          </>
        )
      },
    },
    {
      key: 'project',
      header: 'โครงร่างวิจัย / เอกสารแนบ',
      render: (sub) => {
        const subAttachList = attachments.filter((a) => a.submission_id === sub.id)
        return (
          <>
            <div className="font-bold leading-snug" style={{ color: '#0B1D3A' }}>{sub.project_title}</div>
            {sub.project_description && <p className="text-[10px] text-slate-400 mt-1">{sub.project_description}</p>}
            {subAttachList.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {subAttachList.map((at) => (
                  <button
                    key={at.id}
                    onClick={() => onDownloadPrivateFile(at.file_url)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition font-bold cursor-pointer"
                    style={{ background: 'rgba(14,165,160,0.08)', color: '#0EA5A0' }}
                    title={at.file_name}
                  >
                    <FileText className="w-3 h-3" />
                    {at.file_name || 'ไฟล์แนบ'}
                  </button>
                ))}
              </div>
            )}
          </>
        )
      },
    },
    {
      key: 'reviewer',
      header: 'ผู้ทรงคุณวุฒิ',
      render: (sub) => {
        const reviewer = profiles.find((p) => p.id === sub.assigned_reviewer_id)
        return (
          <div className="font-bold text-slate-700">
            {reviewer ? (
              <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">{reviewer.email}</span>
            ) : (
              <span className="text-slate-400 italic">ยังไม่มอบหมาย</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'สถานะ',
      align: 'center',
      render: (sub) => (
        <>
          <StatusBadge status={sub.status} size="sm" />
          {sub.reviewer_notes && (
            <div className="text-[9px] text-slate-400 mt-1 italic max-w-[150px] truncate mx-auto" title={sub.reviewer_notes}>
              โน้ต: {sub.reviewer_notes.replace(/\[.*?\]/g, '').substring(0, 50)}...
            </div>
          )}
        </>
      ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'center',
      render: (sub) => (
        <div className="flex gap-1.5 justify-center">
          <button
            onClick={() => {
              setSubEditing(sub)
              setSubReviewerInput(sub.assigned_reviewer_id || '')
              setSubStatusInput(sub.status)
              
              const parsed = parseReviewerNotes(sub.reviewer_notes || '')
              setScores(parsed.scores)
              setSubNotesInput(parsed.comments)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
          >
            <UserCheck className="w-3 h-3" />
            แก้ไข/มอบหมาย
          </button>

          {sub.reviewer_notes && (
            <button
              onClick={() => {
                const reviewer = profiles.find((p) => p.id === sub.assigned_reviewer_id)
                const submitter = profiles.find((p) => p.id === sub.submitter_id)
                handleExportEvaluation(sub, reviewer?.email || '', submitter?.email || '')
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border border-slate-200 transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
              style={{ background: '#FFFFFF', color: '#475569' }}
            >
              <ExternalLink className="w-3 h-3" />
              รายงานผล
            </button>
          )}
        </div>
      ),
    },
  ]

  const handleUpdateClick = () => {
    if (subEditing) {
      const serializedNotes = serializeReviewerNotes(scores, subNotesInput)
      onUpdateSubmission(subEditing.id, subReviewerInput || null, subStatusInput, serializedNotes)
    }
  }

  const [subSearch, setSubSearch] = useState('')
  const [formSearch, setFormSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)

  const filteredSubmissions = ethicsSubmissions.filter((sub) => {
    const submitter = profiles.find((p) => p.id === sub.submitter_id)
    const matchesSearch = !subSearch.trim() ||
      sub.project_title.toLowerCase().includes(subSearch.toLowerCase()) ||
      (submitter?.email || '').toLowerCase().includes(subSearch.toLowerCase())

    const matchesStatus = !selectedStatus || sub.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const filteredForms = formSearch.trim()
    ? ethicsForms.filter((form) =>
        form.title.toLowerCase().includes(formSearch.toLowerCase())
      )
    : ethicsForms

  const formColumns: DataTableColumn<any>[] = [
    {
      key: 'title',
      header: 'ชื่อเอกสาร / แบบฟอร์ม',
      render: (form) => <span className="font-bold text-slate-850">{form.title}</span>
    },
    {
      key: 'file_url',
      header: 'ลิงก์ดาวน์โหลด',
      render: (form) => (
        <a
          href={form.file_url}
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
      align: 'center',
      render: (form) => (
        <button
          onClick={() => onDeleteDownloadableForm(form.id)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
          style={{ background: '#FFF1F2', color: '#9F1239', borderColor: '#FECDD3' }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          ลบ
        </button>
      )
    }
  ]

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Submissions List */}
      <MasterDataTable
        badge="บริการ"
        title="คำขอยื่นรับรองจริยธรรมการวิจัยทั้งหมด"
        searchPlaceholder="ค้นหาคำขอจริยธรรม..."
        searchValue={subSearch}
        onSearchChange={setSubSearch}
        filters={[
          {
            key: 'status',
            label: 'สถานะ',
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
              { value: 'ยื่นแล้ว', label: 'ยื่นแล้ว' },
              { value: 'กำลังตรวจ', label: 'กำลังตรวจสอบ' },
              { value: 'รอแก้ไข', label: 'ให้ปรับปรุงเล่ม' },
              { value: 'อนุมัติ', label: 'อนุมัติ' },
              { value: 'ไม่อนุมัติ', label: 'ไม่อนุมัติ' }
            ]
          }
        ]}
        columns={columns}
        data={filteredSubmissions}
        getRowKey={(sub) => sub.id}
        empty={{
          icon: <Clipboard className="w-9 h-9 stroke-[1.5]" />,
          title: 'ยังไม่มีคำขอยื่นรับรองจริยธรรม',
          dashed: true
        }}
      />

      {/* Forms List */}
      <MasterDataTable
        badge="เอกสารประกอบ"
        title="แบบฟอร์มดาวน์โหลดจริยธรรมการวิจัย"
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

          <form
            onSubmit={(e) => {
              onAddDownloadableForm(e)
              setIsAddFormOpen(false)
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-500 mb-1">ชื่อเอกสาร / แบบฟอร์ม *</label>
              <Input
                type="text"
                required
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                placeholder="เช่น แบบฟอร์มขอจริยธรรม วิจัยในมนุษย์..."
                className="w-full light-input text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">หมวดหมู่เอกสาร *</label>
              <select
                value={newFormCat}
                onChange={(e) => setNewFormCat(e.target.value as 'ethics' | 'ip')}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              >
                <option value="ethics">จริยธรรมการวิจัย (Ethics)</option>
                <option value="ip">ทรัพย์สินทางปัญญา (IP)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">URL ไฟล์เอกสาร (จากเว็บหรือฝากไฟล์) *</label>
              <Input
                type="url"
                required
                value={newFormUrl}
                onChange={(e) => setNewFormUrl(e.target.value)}
                placeholder="https://example.com/form.pdf"
                className="w-full light-input text-xs"
              />
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
                className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none"
                style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
              >
                บันทึกแบบฟอร์ม
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SidePanel
        open={!!subEditing}
        onClose={() => setSubEditing(null)}
        title={subEditing?.project_title || ''}
        subtitle={profiles.find((p) => p.id === subEditing?.submitter_id)?.email}
        footer={
          <>
            <button
              onClick={() => setSubEditing(null)}
              className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleUpdateClick}
              className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none"
              style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
            >
              บันทึกการเปลี่ยนแปลง
            </button>
          </>
        }
      >
        {subEditing && (
          <div className="space-y-4">
            {subEditing.project_description && (
              <div>
                <FieldLabel>บทคัดย่อที่ยื่น</FieldLabel>
                <p className="text-xs p-3 bg-slate-50 border border-slate-100 rounded-xl leading-relaxed" style={{ color: '#475569' }}>
                  {subEditing.project_description}
                </p>
              </div>
            )}

            <div>
              <FieldLabel>มอบหมายผู้ทรงคุณวุฒิ</FieldLabel>
              <select
                value={subReviewerInput || NO_REVIEWER}
                onChange={(e) => setSubReviewerInput(e.target.value === NO_REVIEWER ? '' : e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              >
                <option value={NO_REVIEWER}>-- ยังไม่มอบหมาย --</option>
                {profiles
                  .filter((p) => p.role === 'expert' || p.role === 'admin')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.email} ({p.role.toUpperCase()})
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#0EA5A0]" />
                สามารถตั้งสิทธิ์ผู้ทรงฯ ทั้งภายใน/ภายนอก ผ่านแท็บ "ผู้ใช้งานและสิทธิ์"
              </p>
            </div>

            <div>
              <FieldLabel>สถานะคำขอ</FieldLabel>
              <select
                value={subStatusInput}
                onChange={(e) => setSubStatusInput(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              >
                <option value="ยื่นแล้ว">ยื่นแล้ว</option>
                <option value="กำลังตรวจ">กำลังตรวจสอบ (กำลังตรวจ)</option>
                <option value="รอแก้ไข">ให้ปรับปรุงเล่ม (รอแก้ไข)</option>
                <option value="อนุมัติ">อนุมัติคำขอ (อนุมัติ)</option>
                <option value="ไม่อนุมัติ">ไม่อนุมัติคำขอ (ไม่อนุมัติ)</option>
              </select>
            </div>

            {/* Scorecard checklist criteria */}
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <FieldLabel>รายการประเมินจริยธรรม</FieldLabel>
              <div className="space-y-3 bg-slate-50/50 border border-slate-100 p-3 rounded-2xl">
                {EVALUATION_CRITERIA.map((criterion) => (
                  <div key={criterion.key} className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-700 leading-snug">{criterion.label}</div>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg">
                      {[
                        { val: 'pass', label: 'ผ่าน', color: 'peer-checked:bg-emerald-500 peer-checked:text-white text-emerald-700' },
                        { val: 'fail', label: 'ต้องแก้ไข', color: 'peer-checked:bg-amber-500 peer-checked:text-white text-amber-700' },
                        { val: 'na', label: 'N/A', color: 'peer-checked:bg-slate-400 peer-checked:text-white text-slate-600' }
                      ].map(opt => (
                        <label key={opt.val} className="cursor-pointer text-[10px] font-bold text-center">
                          <input
                            type="radio"
                            name={`score-${criterion.key}`}
                            value={opt.val}
                            checked={scores[criterion.key] === opt.val}
                            onChange={() => setScores(prev => ({ ...prev, [criterion.key]: opt.val as any }))}
                            className="sr-only peer"
                          />
                          <div className={`py-1 rounded-md transition peer-checked:shadow-sm ${opt.color} hover:bg-slate-200/50`}>
                            {opt.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>ความเห็นและข้อเสนอแนะเพิ่มเติม</FieldLabel>
              <Textarea
                rows={4}
                value={subNotesInput}
                onChange={(e) => setSubNotesInput(e.target.value)}
                placeholder="เขียนความเห็น คำแนะนำโดยละเอียด หรือระบุจุดที่ต้องแก้ไข..."
                className="w-full light-input text-xs resize-none"
              />
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  )
}
