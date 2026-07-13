import React, { useState } from 'react'
import { Trash2, Calendar, Edit2, Plus, HelpCircle } from 'lucide-react'
import { DataTableColumn } from '../../components/DataTable'
import { MasterDataTable } from '../../components/MasterDataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { SidePanel, FieldLabel } from '../../components/SidePanel'
import { Profile } from '../../context/AuthContext'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

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
  const [appSearch, setAppSearch] = useState('')
  const [eventSearch, setEventSearch] = useState('')
  const [appStatus, setAppStatus] = useState('')
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [isDescOpen, setIsDescOpen] = useState(false)

  // Columns for Appointments
  const appColumns: DataTableColumn<any>[] = [
    {
      key: 'requester',
      header: 'ผู้นัดหมาย',
      render: (app) => {
        const requester = profiles.find((p) => p.id === app.requester_id)
        return (
          <>
            <div className="font-bold" style={{ color: '#0B1D3A' }}>{requester?.email || 'ไม่ระบุผู้ใช้'}</div>
            <div className="text-[9px] text-slate-400 uppercase font-extrabold mt-0.5">สิทธิ์: {requester?.role || 'teacher'}</div>
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
          style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
        >
          <Edit2 className="w-3 h-3" />
          จัดการคิว
        </button>
      ),
    },
  ]

  // Columns for Events
  const eventColumns: DataTableColumn<any>[] = [
    {
      key: 'title',
      header: 'หัวข้อกิจกรรม',
      render: (ev) => (
        <>
          <div className="font-bold" style={{ color: '#0B1D3A' }}>{ev.title}</div>
          {ev.description && <div className="text-[10px] text-slate-400 mt-0.5">{ev.description}</div>}
        </>
      )
    },
    {
      key: 'event_date',
      header: 'วันเวลาจัดงาน',
      render: (ev) => (
        <span className="font-bold" style={{ color: '#0EA5A0' }}>
          🗓️ {new Date(ev.event_date).toLocaleString('th-TH')}
        </span>
      )
    },
    {
      key: 'location',
      header: 'สถานที่',
      render: (ev) => <span className="text-slate-500">{ev.location || '-'}</span>
    },
    {
      key: 'capacity',
      header: 'จำนวนที่รับ (คน)',
      align: 'center',
      render: (ev) => <span className="text-slate-500 font-mono">{ev.capacity || 'ไม่จำกัด'}</span>
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'center',
      render: (ev) => (
        <button
          onClick={() => onDeleteEvent(ev.id)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
          style={{ background: '#FFF1F2', color: '#9F1239', borderColor: '#FECDD3' }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          ลบ
        </button>
      )
    }
  ]

  const filteredAppointments = appointments.filter((app) => {
    const requester = profiles.find((p) => p.id === app.requester_id)
    const matchesSearch = !appSearch.trim() ||
      app.topic.toLowerCase().includes(appSearch.toLowerCase()) ||
      (requester?.email || '').toLowerCase().includes(appSearch.toLowerCase())

    const matchesStatus = !appStatus || app.status === appStatus

    return matchesSearch && matchesStatus
  })

  const filteredEvents = eventSearch.trim()
    ? clinicEvents.filter((ev) =>
        ev.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
        (ev.description || '').toLowerCase().includes(eventSearch.toLowerCase()) ||
        (ev.location || '').toLowerCase().includes(eventSearch.toLowerCase())
      )
    : clinicEvents

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Description Section (Collapsible banner) */}
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}>
        <div className="flex gap-3 items-start">
          <HelpCircle className="w-5 h-5 text-[#0EA5A0] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-slate-800 text-xs">คำอธิบายคลินิกวิจัย</h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xl leading-relaxed">{clinicDesc || 'ไม่มีคำอธิบายการขอคำปรึกษา'}</p>
          </div>
        </div>
        <button
          onClick={() => setIsDescOpen(true)}
          className="h-8 px-3 rounded-lg text-[10px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer shrink-0"
        >
          แก้ไขคำอธิบาย
        </button>
      </div>

      {/* Appointments Management */}
      <MasterDataTable
        badge="บริการ"
        title="คำขอจองนัดหมายรับคำปรึกษาทั้งหมด"
        searchPlaceholder="ค้นหาการนัดหมาย..."
        searchValue={appSearch}
        onSearchChange={setAppSearch}
        filters={[
          {
            key: 'status',
            label: 'สถานะ',
            value: appStatus,
            onChange: setAppStatus,
            options: [
              { value: 'pending', label: 'รออนุมัติ (Pending)' },
              { value: 'approved', label: 'อนุมัติแล้ว (Approved)' },
              { value: 'cancelled', label: 'ยกเลิก (Cancelled)' }
            ]
          }
        ]}
        columns={appColumns}
        data={filteredAppointments}
        getRowKey={(app) => app.id}
        empty={{
          icon: <Calendar className="w-9 h-9 stroke-[1.5]" />,
          title: 'ยังไม่มีคำขอจองนัดหมายปรึกษา',
          dashed: true
        }}
      />

      {/* Events Management */}
      <MasterDataTable
        badge="คอร์สสัมมนา"
        title="กิจกรรมสัมมนา / Workshop ทั้งหมด"
        actionButton={{
          label: 'เพิ่มกิจกรรมสัมมนา',
          onClick: () => setIsAddEventOpen(true),
          icon: <Plus className="w-4 h-4" />
        }}
        searchPlaceholder="ค้นหากิจกรรมสัมมนา..."
        searchValue={eventSearch}
        onSearchChange={setEventSearch}
        columns={eventColumns}
        data={filteredEvents}
        getRowKey={(ev) => ev.id}
        empty={{
          icon: <Calendar className="w-9 h-9 stroke-[1.5]" />,
          title: 'ไม่มีรายการกิจกรรมในระบบ',
          dashed: true
        }}
      />

      {/* Edit Description Dialog */}
      <Dialog open={isDescOpen} onOpenChange={setIsDescOpen}>
        <DialogContent className="max-w-[480px] w-full p-6 space-y-4 rounded-2xl shadow-2xl border border-slate-200 animate-fadeIn">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>บริการ</p>
            <DialogTitle className="text-sm font-black text-slate-900 leading-snug">
              แก้ไขคำอธิบายคลินิกวิจัย
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              ข้อความนี้จะแสดงให้คณาจารย์และบุคลากรทั่วไปเห็นที่หน้าขอรับคำปรึกษา
            </DialogDescription>
          </div>

          <div className="space-y-4">
            <Textarea
              rows={4}
              value={clinicDesc}
              onChange={(e) => setClinicDesc(e.target.value)}
              className="w-full light-input text-xs resize-none"
              placeholder="กรอกรายละเอียดการให้บริการ เช่น เวลาทำการ หรือขอบเขตการให้คำปรึกษา..."
            />

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDescOpen(false)}
                className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onUpdateClinicDesc()
                  setIsDescOpen(false)
                }}
                className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none"
                style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
              >
                บันทึกคำอธิบาย
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="max-w-[480px] w-full p-6 space-y-4 rounded-2xl shadow-2xl border border-slate-200 animate-fadeIn">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>คอร์สสัมมนา</p>
            <DialogTitle className="text-sm font-black text-slate-900 leading-snug">
              เพิ่มกิจกรรมสัมมนา / Workshop
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              สร้างหัวข้อสัมมนาและกำหนดจำนวนผู้เข้าร่วมกิจกรรม
            </DialogDescription>
          </div>

          <form
            onSubmit={(e) => {
              onAddEvent(e)
              setIsAddEventOpen(false)
            }}
            className="space-y-4 text-xs"
          >
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
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <label className="block font-bold text-slate-500 mb-1">จำนวนที่รับ (คน)</label>
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

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddEventOpen(false)}
                className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none"
                style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
              >
                บันทึกกิจกรรม
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SidePanel
        open={!!appEditing}
        onClose={() => setAppEditing(null)}
        title={appEditing?.topic || ''}
        subtitle={profiles.find((p) => p.id === appEditing?.requester_id)?.email}
        footer={
          <>
            <button
              onClick={() => setAppEditing(null)}
              className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => appEditing && onUpdateAppStatus(appEditing.id, appStatusInput, appNotesInput)}
              className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none"
              style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
            >
              บันทึกการเปลี่ยนแปลง
            </button>
          </>
        }
      >
        {appEditing && (
          <div className="space-y-4">
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
              <select
                value={appStatusInput}
                onChange={(e) => setAppStatusInput(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              >
                <option value="pending">รอการยืนยัน</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="cancelled">ยกเลิก</option>
                <option value="completed">เสร็จสิ้น</option>
              </select>
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
          </div>
        )}
      </SidePanel>
    </div>
  )
}

