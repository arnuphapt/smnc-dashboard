import React from 'react'
import { Award } from 'lucide-react'
import { DataTable, DataTableColumn } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { SidePanel, FieldLabel } from '../../components/SidePanel'
import { Profile } from '../../context/AuthContext'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

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
}

export const IpTab: React.FC<IpTabProps> = ({
  ipApplications, profiles, ipEditing, setIpEditing,
  ipReqNumInput, setIpReqNumInput, ipStepInput, setIpStepInput,
  ipNotesInput, setIpNotesInput, ipStatusInput, setIpStatusInput,
  onUpdateIPApp, onTransferToCatalog,
}) => {
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
      key: 'step',
      header: 'ขั้นตอนปัจจุบัน',
      render: (app) => (
        <div className="space-y-0.5">
          {app.current_step && <div className="font-bold" style={{ color: '#0B1D3A' }}>👉 {app.current_step}</div>}
          {app.admin_notes && <div className="text-[10px] text-slate-400 italic">โน้ต: {app.admin_notes}</div>}
        </div>
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
        <button
          onClick={() => {
            setIpEditing(app)
            setIpReqNumInput(app.request_number || '')
            setIpStepInput(app.current_step || '')
            setIpNotesInput(app.admin_notes || '')
            setIpStatusInput(app.status)
          }}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
          style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0' }}
        >
          แก้ไขคำขอ
        </button>
      ),
    },
    {
      key: 'catalog',
      header: 'คลังหลัก',
      align: 'center',
      render: (app) =>
        app.transferred_to_catalog ? (
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">โอนย้ายแล้ว</span>
        ) : (
          <button
            onClick={() => onTransferToCatalog(app)}
            className="px-2 py-1 rounded text-[10px] font-bold transition shadow-sm cursor-pointer text-white"
            style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #0EA5A0 100%)' }}
          >
            โอนเข้าคลัง
          </button>
        ),
    },
  ]

  return (
    <div className="space-y-5 text-xs text-slate-700">
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
