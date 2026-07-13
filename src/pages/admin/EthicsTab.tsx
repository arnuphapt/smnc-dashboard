import React from 'react'
import { Trash2, ExternalLink, Clipboard, FileText, UserCheck } from 'lucide-react'
import { DataTable, DataTableColumn } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { SidePanel, FieldLabel } from '../../components/SidePanel'
import { EmptyState } from '../../components/EmptyState'
import { Profile } from '../../context/AuthContext'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const NO_REVIEWER = '__none__'

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
              โน้ต: {sub.reviewer_notes}
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
        <button
          onClick={() => {
            setSubEditing(sub)
            setSubReviewerInput(sub.assigned_reviewer_id || '')
            setSubStatusInput(sub.status)
            setSubNotesInput(sub.reviewer_notes || '')
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
          style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
        >
          <UserCheck className="w-3 h-3" />
          แก้ไข/มอบหมาย
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Downloadable Forms Manager */}
        <div className="rounded-2xl p-5 space-y-5 h-fit" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
          <div>
            <h3 className="text-sm font-black mb-3" style={{ color: '#0B1D3A' }}>เพิ่มแบบฟอร์มดาวน์โหลดใหม่</h3>
            <form onSubmit={onAddDownloadableForm} className="space-y-3">
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
                <Select
                  value={newFormCat}
                  onValueChange={(v) => setNewFormCat((v ?? 'ethics') as 'ethics' | 'ip')}
                  items={[
                    { value: 'ethics', label: 'จริยธรรมการวิจัย (Ethics)' },
                    { value: 'ip', label: 'ทรัพย์สินทางปัญญา (IP)' },
                  ]}
                >
                  <SelectTrigger className="w-full light-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethics">จริยธรรมการวิจัย (Ethics)</SelectItem>
                    <SelectItem value="ip">ทรัพย์สินทางปัญญา (IP)</SelectItem>
                  </SelectContent>
                </Select>
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
              <Button type="submit" className="btn-primary w-full !py-2 h-auto">
                บันทึกแบบฟอร์ม
              </Button>
            </form>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>แบบฟอร์มดาวน์โหลดปัจจุบัน</h4>
            {ethicsForms.length === 0 ? (
              <EmptyState icon={<Clipboard className="w-8 h-8 stroke-[1.5]" />} title="ไม่มีแบบฟอร์มดาวน์โหลดในระบบ" />
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {ethicsForms.map((form) => (
                  <div key={form.id} className="p-3 rounded-xl flex justify-between items-start gap-2" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                    <div className="min-w-0">
                      <h5 className="font-bold leading-tight truncate" style={{ color: '#0B1D3A' }}>{form.title}</h5>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <a
                        href={form.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0' }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => onDeleteDownloadableForm(form.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200/50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right/Middle: Ethics Submissions List */}
        <div className="lg:col-span-2 rounded-2xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>บริการ</p>
            <h3 className="text-sm font-black" style={{ color: '#0B1D3A' }}>คำขอยื่นรับรองจริยธรรมการวิจัยทั้งหมด</h3>
          </div>

          <DataTable
            columns={columns}
            data={ethicsSubmissions}
            getRowKey={(sub) => sub.id}
            empty={{ icon: <Clipboard className="w-9 h-9 stroke-[1.5]" />, title: 'ยังไม่มีคำขอยื่นรับรองจริยธรรม', dashed: true }}
          />
        </div>
      </div>

      <SidePanel
        open={!!subEditing}
        onClose={() => setSubEditing(null)}
        title={subEditing?.project_title || ''}
        subtitle={profiles.find((p) => p.id === subEditing?.submitter_id)?.email}
        footer={
          <>
            <Button variant="outline" onClick={() => setSubEditing(null)} className="font-bold text-xs">
              ยกเลิก
            </Button>
            <Button
              onClick={() => subEditing && onUpdateSubmission(subEditing.id, subReviewerInput || null, subStatusInput, subNotesInput)}
              className="btn-primary text-xs !py-2 !px-4 h-auto"
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </>
        }
      >
        {subEditing && (
          <>
            {subEditing.project_description && (
              <div>
                <FieldLabel>บทคัดย่อที่ยื่น</FieldLabel>
                <p className="text-xs" style={{ color: '#475569' }}>{subEditing.project_description}</p>
              </div>
            )}
            <div>
              <FieldLabel>มอบหมายผู้ทรงคุณวุฒิ</FieldLabel>
              <Select
                value={subReviewerInput || NO_REVIEWER}
                onValueChange={(v) => setSubReviewerInput(v === NO_REVIEWER ? '' : (v ?? ''))}
                items={[
                  { value: NO_REVIEWER, label: '-- ยังไม่มอบหมาย --' },
                  ...profiles
                    .filter((p) => p.role === 'expert' || p.role === 'admin')
                    .map((p) => ({ value: p.id, label: `${p.email} (${p.role.toUpperCase()})` })),
                ]}
              >
                <SelectTrigger className="w-full light-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_REVIEWER}>-- ยังไม่มอบหมาย --</SelectItem>
                  {profiles
                    .filter((p) => p.role === 'expert' || p.role === 'admin')
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.email} ({p.role.toUpperCase()})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>สถานะ</FieldLabel>
              <Select
                value={subStatusInput}
                onValueChange={(v) => setSubStatusInput(v ?? '')}
                items={['ยื่นแล้ว', 'กำลังตรวจ', 'รอแก้ไข', 'อนุมัติ', 'ไม่อนุมัติ'].map((s) => ({ value: s, label: s }))}
              >
                <SelectTrigger className="w-full light-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ยื่นแล้ว">ยื่นแล้ว</SelectItem>
                  <SelectItem value="กำลังตรวจ">กำลังตรวจ</SelectItem>
                  <SelectItem value="รอแก้ไข">รอแก้ไข</SelectItem>
                  <SelectItem value="อนุมัติ">อนุมัติ</SelectItem>
                  <SelectItem value="ไม่อนุมัติ">ไม่อนุมัติ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>ความเห็นผู้ตรวจ</FieldLabel>
              <Textarea
                rows={3}
                value={subNotesInput}
                onChange={(e) => setSubNotesInput(e.target.value)}
                placeholder="เขียนความเห็น คำแนะนำ หรือจุดที่ต้องแก้ไข..."
                className="w-full light-input text-xs resize-none"
              />
            </div>
          </>
        )}
      </SidePanel>
    </div>
  )
}
