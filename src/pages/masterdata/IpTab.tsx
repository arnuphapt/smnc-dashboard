import React, { useState } from 'react'
import { Award, Edit2, Share2, Clipboard, Trash2, ExternalLink, Plus } from 'lucide-react'
import { DataTableColumn } from '../../components/DataTable'
import { MasterDataTable } from '../../components/MasterDataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { SidePanel, FieldLabel } from '../../components/SidePanel'
import { Profile } from '../../context/AuthContext'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

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

  const [appSearch, setAppSearch] = useState('')
  const [formSearch, setFormSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)

  const filteredIpApplications = ipApplications.filter((app) => {
    const applicant = profiles.find((p) => p.id === app.applicant_id)
    const matchesSearch = !appSearch.trim() ||
      app.title.toLowerCase().includes(appSearch.toLowerCase()) ||
      (applicant?.email || '').toLowerCase().includes(appSearch.toLowerCase())

    const matchesStatus = !selectedStatus || app.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const filteredForms = formSearch.trim()
    ? ipForms.filter((form) =>
        form.title.toLowerCase().includes(formSearch.toLowerCase())
      )
    : ipForms

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setNewFormCat('ip')
    onAddDownloadableForm(e)
    setIsAddFormOpen(false)
  }

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* IP Applications List */}
      <MasterDataTable
        badge="บริการ"
        title="รายการยื่นขอขึ้นทะเบียนทรัพย์สินทางปัญญาทั้งหมด"
        searchPlaceholder="ค้นหาคำขอทรัพย์สินทางปัญญา..."
        searchValue={appSearch}
        onSearchChange={setAppSearch}
        filters={[
          {
            key: 'status',
            label: 'สถานะ',
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
              { value: 'ยื่นคำขอ', label: 'ยื่นคำขอ' },
              { value: 'กำลังตรวจสอบ', label: 'กำลังตรวจสอบ' },
              { value: 'รอเอกสารเพิ่ม', label: 'รอเอกสารเพิ่ม (รอแก้ไข)' },
              { value: 'อนุมัติ', label: 'อนุมัติ' },
              { value: 'ไม่อนุมัติ', label: 'ไม่อนุมัติ' }
            ]
          }
        ]}
        columns={columns}
        data={filteredIpApplications}
        getRowKey={(app) => app.id}
        empty={{
          icon: <Award className="w-10 h-10 stroke-[1.5]" />,
          title: 'ยังไม่มีคำขอยื่นขึ้นทะเบียนทรัพย์สินทางปัญญา',
          dashed: true
        }}
      />

      {/* Forms List */}
      <MasterDataTable
        badge="เอกสารประกอบ"
        title="แบบฟอร์มดาวน์โหลดทรัพย์สินทางปัญญา"
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
              เพิ่มแบบฟอร์มดาวน์โหลด IP
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
                placeholder="เช่น แบบฟอร์มขอจดทะเบียนลิขสิทธิ์..."
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
                <option value="ip">ทรัพย์สินทางปัญญา (IP)</option>
                <option value="ethics">จริยธรรมการวิจัย (Ethics)</option>
              </select>
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
        open={!!ipEditing}
        onClose={() => setIpEditing(null)}
        title={ipEditing?.title || ''}
        subtitle={profiles.find((p) => p.id === ipEditing?.applicant_id)?.email}
        footer={
          <>
            <button
              onClick={() => setIpEditing(null)}
              className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => ipEditing && onUpdateIPApp(ipEditing.id, ipStatusInput, ipStepInput, ipNotesInput, ipReqNumInput)}
              className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none"
              style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
            >
              บันทึกการเปลี่ยนแปลง
            </button>
          </>
        }
      >
        {ipEditing && (
          <div className="space-y-4">
            <div>
              <FieldLabel>ประเภททรัพย์สินทางปัญญา</FieldLabel>
              <p className="text-xs font-semibold text-slate-800">{ipEditing.ip_type}</p>
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
              <select
                value={ipStatusInput}
                onChange={(e) => setIpStatusInput(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              >
                <option value="ยื่นคำขอ">ยื่นคำขอ</option>
                <option value="กำลังตรวจสอบ">กำลังตรวจสอบ</option>
                <option value="รอเอกสารเพิ่ม">รอเอกสารเพิ่ม (รอแก้ไข)</option>
                <option value="อนุมัติ">อนุมัติ</option>
                <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
              </select>
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
          </div>
        )}
      </SidePanel>
    </div>
  )
}
