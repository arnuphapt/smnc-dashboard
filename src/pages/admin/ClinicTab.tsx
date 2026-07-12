import React from 'react'
import { Trash2, Calendar } from 'lucide-react'
import { DataTable, DataTableColumn } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { SidePanel, FieldLabel } from '../../components/SidePanel'
import { EmptyState } from '../../components/EmptyState'
import { Profile } from '../../context/AuthContext'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

interface ClinicTabProps {
  clinicDesc: string
  setClinicDesc: (value: string) => void
  onUpdateClinicDesc: () => void

  newEvTitle: string
  setNewEvTitle: (value: string) => void
  newEvDesc: string
  setNewEvDesc: (value: string) => void
  newEvDate: string
  setNewEvDate: (value: string) => void
  newEvLoc: string
  setNewEvLoc: (value: string) => void
  newEvCap: string
  setNewEvCap: (value: string) => void
  onAddEvent: (e: React.FormEvent) => void
  clinicEvents: any[]
  onDeleteEvent: (id: string) => void

  appointments: any[]
  profiles: Profile[]
  appEditing: any | null
  setAppEditing: (app: any | null) => void
  appStatusInput: string
  setAppStatusInput: (value: string) => void
  appNotesInput: string
  setAppNotesInput: (value: string) => void
  onUpdateAppStatus: (id: string, status: string, notes: string) => void
}

export const ClinicTab: React.FC<ClinicTabProps> = ({
  clinicDesc, setClinicDesc, onUpdateClinicDesc,
  newEvTitle, setNewEvTitle, newEvDesc, setNewEvDesc, newEvDate, setNewEvDate,
  newEvLoc, setNewEvLoc, newEvCap, setNewEvCap, onAddEvent, clinicEvents, onDeleteEvent,
  appointments, profiles, appEditing, setAppEditing,
  appStatusInput, setAppStatusInput, appNotesInput, setAppNotesInput, onUpdateAppStatus,
}) => {
  const columns: DataTableColumn<any>[] = [
    {
      key: 'requester',
      header: 'ผู้นัดหมาย',
      render: (app) => {
        const requester = profiles.find((p) => p.id === app.requester_id)
        return (
          <>
            <div className="font-bold" style={{ color: '#0B1D3A' }}>{requester?.email || 'ไม่ระบุผู้ใช้'}</div>
            <div className="text-[9px] text-slate-400 uppercase font-extrabold mt-0.5">Role: {requester?.role || 'teacher'}</div>
          </>
        )
      },
    },
    {
      key: 'topic',
      header: 'หัวข้อ / วันเวลาเข้าพบ',
      render: (app) => (
        <>
          <div className="font-bold" style={{ color: '#0B1D3A' }}>{app.topic}</div>
          <div className="text-[10px] font-bold mt-1" style={{ color: '#0EA5A0' }}>
            🗓️ {new Date(app.requested_at).toLocaleString('th-TH')}
          </div>
        </>
      ),
    },
    {
      key: 'notes',
      header: 'หมายเหตุ',
      render: (app) => <span className="text-slate-500 max-w-[150px] truncate block" title={app.notes}>{app.notes || '-'}</span>,
    },
    {
      key: 'status',
      header: 'สถานะ',
      align: 'center',
      render: (app) => (
        <>
          <StatusBadge status={app.status} size="sm" />
          {app.admin_notes && (
            <div className="text-[9px] text-slate-400 mt-1 italic max-w-[140px] truncate mx-auto" title={app.admin_notes}>
              โน้ต: {app.admin_notes}
            </div>
          )}
        </>
      ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'center',
      render: (app) => (
        <button
          onClick={() => {
            setAppEditing(app)
            setAppStatusInput(app.status)
            setAppNotesInput(app.admin_notes || '')
          }}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
          style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0' }}
        >
          จัดการ
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Description Section */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>บริการ</p>
          <h3 className="text-sm font-black" style={{ color: '#0B1D3A' }}>คำอธิบายคลินิกวิจัย (สำหรับผู้ใช้งานทั่วไป)</h3>
        </div>
        <Textarea
          rows={3}
          value={clinicDesc}
          onChange={(e) => setClinicDesc(e.target.value)}
          className="w-full light-input text-xs resize-none"
        />
        <div className="flex justify-end">
          <Button onClick={onUpdateClinicDesc} className="btn-primary !py-2 !px-4 h-auto">
            บันทึกข้อมูลคลินิก
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Events Management */}
        <div className="rounded-2xl p-5 space-y-5 h-fit" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
          <div>
            <h3 className="text-sm font-black mb-3" style={{ color: '#0B1D3A' }}>เพิ่มกิจกรรมสัมมนา / Workshop</h3>
            <form onSubmit={onAddEvent} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">หัวข้อกิจกรรม *</label>
                <Input
                  type="text"
                  required
                  value={newEvTitle}
                  onChange={(e) => setNewEvTitle(e.target.value)}
                  placeholder="เช่น การใช้สถิติเบื้องต้นในงานวิจัย"
                  className="w-full light-input text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">รายละเอียด</label>
                <Textarea
                  value={newEvDesc}
                  onChange={(e) => setNewEvDesc(e.target.value)}
                  placeholder="อธิบายกิจกรรมคร่าวๆ..."
                  className="w-full light-input text-xs resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">วันเวลาจัดงาน *</label>
                  <Input
                    type="datetime-local"
                    required
                    value={newEvDate}
                    onChange={(e) => setNewEvDate(e.target.value)}
                    className="w-full light-input text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">จำนวนที่รับ</label>
                  <Input
                    type="number"
                    value={newEvCap}
                    onChange={(e) => setNewEvCap(e.target.value)}
                    placeholder="ไม่จำกัด"
                    className="w-full light-input text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">สถานที่จัดงาน</label>
                <Input
                  type="text"
                  value={newEvLoc}
                  onChange={(e) => setNewEvLoc(e.target.value)}
                  placeholder="เช่น ห้องประชุมอาคาร 3"
                  className="w-full light-input text-xs"
                />
              </div>
              <Button type="submit" className="btn-primary w-full !py-2 h-auto">
                บันทึกกิจกรรม
              </Button>
            </form>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>รายการกิจกรรมปัจจุบัน</h4>
            {clinicEvents.length === 0 ? (
              <EmptyState icon={<Calendar className="w-8 h-8 stroke-[1.5]" />} title="ไม่มีรายการกิจกรรมในระบบ" />
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {clinicEvents.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl flex justify-between items-start gap-2" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                    <div>
                      <h5 className="font-bold leading-tight" style={{ color: '#0B1D3A' }}>{ev.title}</h5>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(ev.event_date).toLocaleString('th-TH')}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteEvent(ev.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200/50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right/Middle: Appointments Management */}
        <div className="lg:col-span-2 rounded-2xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>บริการ</p>
            <h3 className="text-sm font-black" style={{ color: '#0B1D3A' }}>คำขอจองนัดหมายรับคำปรึกษาทั้งหมด</h3>
          </div>

          <DataTable
            columns={columns}
            data={appointments}
            getRowKey={(app) => app.id}
            empty={{ icon: <Calendar className="w-9 h-9 stroke-[1.5]" />, title: 'ยังไม่มีคำขอจองนัดหมายปรึกษา', dashed: true }}
          />
        </div>
      </div>

      <SidePanel
        open={!!appEditing}
        onClose={() => setAppEditing(null)}
        title={appEditing?.topic || ''}
        subtitle={profiles.find((p) => p.id === appEditing?.requester_id)?.email}
        footer={
          <>
            <Button variant="outline" onClick={() => setAppEditing(null)} className="font-bold text-xs">
              ยกเลิก
            </Button>
            <Button
              onClick={() => appEditing && onUpdateAppStatus(appEditing.id, appStatusInput, appNotesInput)}
              className="btn-primary text-xs !py-2 !px-4 h-auto"
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </>
        }
      >
        {appEditing && (
          <>
            <div>
              <FieldLabel>หัวข้อที่ขอปรึกษา</FieldLabel>
              <p className="text-xs font-semibold" style={{ color: '#0B1D3A' }}>{appEditing.topic}</p>
              {appEditing.notes && <p className="text-xs mt-1" style={{ color: '#64748B' }}>{appEditing.notes}</p>}
            </div>
            <div>
              <FieldLabel>วันเวลาที่ขอนัด</FieldLabel>
              <p className="text-xs font-semibold" style={{ color: '#0B1D3A' }}>{new Date(appEditing.requested_at).toLocaleString('th-TH')}</p>
            </div>
            <div>
              <FieldLabel>สถานะ</FieldLabel>
              <Select
                value={appStatusInput}
                onValueChange={(v) => setAppStatusInput(v ?? '')}
                items={[
                  { value: 'pending', label: 'รอการยืนยัน' },
                  { value: 'confirmed', label: 'ยืนยันแล้ว' },
                  { value: 'cancelled', label: 'ยกเลิก' },
                  { value: 'completed', label: 'เสร็จสิ้น' },
                ]}
              >
                <SelectTrigger className="w-full light-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">รอการยืนยัน</SelectItem>
                  <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>โน้ตตอบกลับถึงผู้จอง</FieldLabel>
              <Textarea
                rows={3}
                value={appNotesInput}
                onChange={(e) => setAppNotesInput(e.target.value)}
                placeholder="เช่น ยืนยันนัดแล้ว พบกันที่ห้องประชุม..."
                className="w-full light-input text-xs resize-none"
              />
            </div>
          </>
        )}
      </SidePanel>
    </div>
  )
}
