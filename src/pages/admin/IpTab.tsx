import React from 'react'
import { Award, Edit2, Share2, Clipboard, Trash2, ExternalLink } from 'lucide-react'
import { DataTable, DataTableColumn } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { SidePanel, FieldLabel } from '../../components/SidePanel'
import { Profile } from '../../context/AuthContext'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { EmptyState } from '../../components/EmptyState'

interface IpTabProps {
  ipApplications: any[]
  profiles: Profile[]
  ipEditing: any | null
  setIpEditing: (app: any | null) => void
  ipReqNumInput: string
  setIpReqNumInput: (value: string) => void
  ipStepInput: string
  setIpStepInput: (value: string) => void
  ipNotesInput: string
  setIpNotesInput: (value: string) => void
  ipStatusInput: string
  setIpStatusInput: (value: string) => void
  onUpdateIPApp: (id: string, status: string, step: string, notes: string, reqNum: string) => void
  onTransferToCatalog: (app: any) => void

  newFormTitle: string
  setNewFormTitle: (value: string) => void
  newFormCat: 'ethics' | 'ip'
  setNewFormCat: (value: 'ethics' | 'ip') => void
  newFormUrl: string
  setNewFormUrl: (value: string) => void
  onAddDownloadableForm: (e: React.FormEvent) => void
  downloadableForms: any[]
  onDeleteDownloadableForm: (id: string) => void
}

export const IpTab: React.FC<IpTabProps> = ({
  ipApplications, profiles, ipEditing, setIpEditing,
  ipReqNumInput, setIpReqNumInput, ipStepInput, setIpStepInput,
  ipNotesInput, setIpNotesInput, ipStatusInput, setIpStatusInput,
  onUpdateIPApp, onTransferToCatalog,
  newFormTitle, setNewFormTitle, newFormCat, setNewFormCat, newFormUrl, setNewFormUrl,
  onAddDownloadableForm, downloadableForms, onDeleteDownloadableForm,
}) => {
  const ipForms = downloadableForms.filter((f) => f.category === 'ip')

  const columns: DataTableColumn<any>[] = [
    {
      key: 'applicant',
      header: 'ผู้ยื่นคำขอ',
      render: (app) => {
        const applicant = profiles.find((p) => p.id === app.applicant_id)
        return (
          <>
            <div className="font-bold" style={{ color: '#0B1D3A' }}>{applicant?.email || 'ไม่ระบุผู้ใช้'}</div>
            <p className="text-[9px] text-slate-400 mt-0.5">🗓️ วันที่ยื่น: {new Date(app.created_at).toLocaleDateString('th-TH')}</p>
          </>
        )
      },
    },
    {
      key: 'title',
      header: 'ชื่อผลงาน / ประเภท',
      render: (app) => (
        <>
          <div className="font-bold" style={{ color: '#0B1D3A' }}>{app.title}</div>
          <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/50 mt-1">
            {app.ip_type}
          </span>
        </>
      ),
    },
    {
      key: 'request_number',
      header: 'เลขที่คำขอ',
      render: (app) => (
        <span className="font-mono font-bold text-slate-700">
          {app.request_number || <span className="text-slate-400 italic font-sans font-medium">ไม่มีเลขที่คำขอ</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      align: 'center',
      render: (app) => <StatusBadge status={app.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'center',
      render: (app) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setIpEditing(app)
              setIpReqNumInput(app.request_number || '')
              setIpStepInput(app.current_step || '')
              setIpNotesInput(app.admin_notes || '')
              setIpStatusInput(app.status)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
          >
            <Edit2 className="w-3 h-3" />
            แก้ไขคำขอ
          </button>

          {app.transferred_to_catalog ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              โอนย้ายแล้ว
            </span>
          ) : (
            <button
              onClick={() => onTransferToCatalog(app)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer text-white"
              style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #0EA5A0 100%)' }}
            >
              <Share2 className="w-3 h-3" />
              โอนเข้าคลัง
            </button>
          )}
        </div>
      ),
    },
  ]

  // Form submission handler local wrapper to set category to 'ip' automatically
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setNewFormCat('ip')
    onAddDownloadableForm(e)
  }

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Downloadable Forms Manager */}
        <div className="rounded-2xl p-5 space-y-5 h-fit" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
          <div>
            <h3 className="text-sm font-black mb-3" style={{ color: '#0B1D3A' }}>เพิ่มแบบฟอร์มดาวน์โหลด IP</h3>
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">ชื่อเอกสาร / แบบฟอร์ม *</label>
                <Input
                  type="text"
                  required
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  placeholder="เช่น แบบฟอร์มขอจดทะเบียนลิขสิทธิ์..."
                  className="w-full light-input text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">หมวดหมู่เอกสาร *</label>
                <Select
                  value={newFormCat}
                  onValueChange={(v) => setNewFormCat((v ?? 'ip') as 'ethics' | 'ip')}
                >
                  <SelectTrigger className="w-full light-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ip">ทรัพย์สินทางปัญญา (IP)</SelectItem>
                    <SelectItem value="ethics">จริยธรรมการวิจัย (Ethics)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">URL ไฟล์เอกสาร *</label>
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
            {ipForms.length === 0 ? (
              <EmptyState icon={<Clipboard className="w-8 h-8 stroke-[1.5]" />} title="ไม่มีแบบฟอร์มดาวน์โหลดในระบบ" />
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {ipForms.map((form) => (
                  <div key={form.id} className="p-3 rounded-xl flex justify-between items-start gap-2" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold leading-tight truncate text-slate-800" title={form.title}>{form.title}</h5>
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

        {/* Right: IP Applications list */}
        <div className="lg:col-span-2 rounded-2xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>บริการ</p>
            <h3 className="text-base font-black" style={{ color: '#0B1D3A' }}>รายการยื่นขอขึ้นทะเบียนทรัพย์สินทางปัญญาทั้งหมด</h3>
          </div>

          <DataTable
            columns={columns}
            data={ipApplications}
            getRowKey={(app) => app.id}
            empty={{ icon: <Award className="w-10 h-10 stroke-[1.5]" />, title: 'ยังไม่มีคำขอยื่นขึ้นทะเบียนทรัพย์สินทางปัญญา', dashed: true }}
          />
        </div>
      </div>

      <SidePanel
        open={!!ipEditing}
        onClose={() => setIpEditing(null)}
        title={ipEditing?.title || ''}
        subtitle={profiles.find((p) => p.id === ipEditing?.applicant_id)?.email}
        footer={
          <>
            <Button variant="outline" onClick={() => setIpEditing(null)} className="font-bold text-xs">
              ยกเลิก
            </Button>
            <Button
              onClick={() => ipEditing && onUpdateIPApp(ipEditing.id, ipStatusInput, ipStepInput, ipNotesInput, ipReqNumInput)}
              className="btn-primary text-xs !py-2 !px-4 h-auto"
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </>
        }
      >
        {ipEditing && (
          <>
            <div>
              <FieldLabel>ประเภททรัพย์สินทางปัญญา</FieldLabel>
              <p className="text-xs font-semibold" style={{ color: '#0B1D3A' }}>{ipEditing.ip_type}</p>
            </div>
            <div>
              <FieldLabel>เลขที่คำขอ (กรมทรัพย์สินฯ)</FieldLabel>
              <Input
                type="text"
                value={ipReqNumInput}
                onChange={(e) => setIpReqNumInput(e.target.value)}
                placeholder="เช่น 2003001234"
                className="w-full light-input text-xs font-mono"
              />
            </div>
            <div>
              <FieldLabel>ขั้นตอนปัจจุบัน</FieldLabel>
              <Input
                type="text"
                value={ipStepInput}
                onChange={(e) => setIpStepInput(e.target.value)}
                placeholder="เช่น ตรวจสอบความถูกต้อง"
                className="w-full light-input text-xs"
              />
            </div>
            <div>
              <FieldLabel>สถานะ</FieldLabel>
              <Select
                value={ipStatusInput}
                onValueChange={(v) => setIpStatusInput(v ?? '')}
                items={['ยื่นคำขอ', 'กำลังตรวจสอบ', 'รอเอกสารเพิ่ม', 'อนุมัติ', 'ไม่อนุมัติ'].map((s) => ({ value: s, label: s }))}
              >
                <SelectTrigger className="w-full light-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ยื่นคำขอ">ยื่นคำขอ</SelectItem>
                  <SelectItem value="กำลังตรวจสอบ">กำลังตรวจสอบ</SelectItem>
                  <SelectItem value="รอเอกสารเพิ่ม">รอเอกสารเพิ่ม</SelectItem>
                  <SelectItem value="อนุมัติ">อนุมัติ</SelectItem>
                  <SelectItem value="ไม่อนุมัติ">ไม่อนุมัติ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>โน้ตเพิ่มเติมถึงผู้ยื่น</FieldLabel>
              <Textarea
                rows={3}
                value={ipNotesInput}
                onChange={(e) => setIpNotesInput(e.target.value)}
                placeholder="เช่น รอเอกสารเพิ่มเติม..."
                className="w-full light-input text-xs resize-none"
              />
            </div>
          </>
        )}
      </SidePanel>
    </div>
  )
}
