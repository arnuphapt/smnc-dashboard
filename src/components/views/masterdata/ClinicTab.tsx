'use client'

import React, { useState } from 'react'
import { Trash2, Calendar, Edit2, Plus } from 'lucide-react'
import { DataTableColumn } from '@/components/DataTable'
import { MasterDataTable } from '@/components/MasterDataTable'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase } from '@/services/supabase'

interface ClinicTabProps {
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
}

export const ClinicTab: React.FC<ClinicTabProps> = ({
  newEvTitle, setNewEvTitle, newEvDesc, setNewEvDesc, newEvDate, setNewEvDate,
  newEvLoc, setNewEvLoc, newEvCap, setNewEvCap, onAddEvent, clinicEvents, onDeleteEvent,
}) => {
  const [eventSearch, setEventSearch] = useState('')
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)

  // Edit Event States
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const [editEvTitle, setEditEvTitle] = useState('')
  const [editEvDesc, setEditEvDesc] = useState('')
  const [editEvDate, setEditEvDate] = useState('')
  const [editEvLoc, setEditEvLoc] = useState('')
  const [editEvCap, setEditEvCap] = useState('')

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
      align: 'right',
      render: (ev) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setEditingEvent(ev)
              setEditEvTitle(ev.title)
              setEditEvDesc(ev.description || '')
              setEditEvDate(ev.event_date ? new Date(ev.event_date).toISOString().substring(0, 16) : '')
              setEditEvLoc(ev.location || '')
              setEditEvCap(ev.capacity ? String(ev.capacity) : '')
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
          >
            <Edit2 className="w-3 h-3" />
            แก้ไข
          </button>
          <button
            onClick={() => onDeleteEvent(ev.id)}
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

  const filteredEvents = eventSearch.trim()
    ? clinicEvents.filter((ev) =>
        ev.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
        (ev.description || '').toLowerCase().includes(eventSearch.toLowerCase()) ||
        (ev.location || '').toLowerCase().includes(eventSearch.toLowerCase())
      )
    : clinicEvents

  return (
    <div className="space-y-6 text-xs text-slate-700">
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
          title: 'ยังไม่มีกิจกรรมสัมมนา',
          dashed: true
        }}
      />

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

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-[480px] w-full p-6 space-y-4 rounded-2xl shadow-2xl border border-slate-200 animate-fadeIn">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>คอร์สสัมมนา</p>
            <DialogTitle className="text-sm font-black text-slate-900 leading-snug">
              แก้ไขกิจกรรมสัมมนา / Workshop
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              แก้ไขรายละเอียด กิจกรรม หรือข้อมูลวันจัดงาน
            </DialogDescription>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!editingEvent || !editEvTitle || !editEvDate) return
              try {
                const { error } = await supabase.from('clinic_events').update({
                  title: editEvTitle,
                  description: editEvDesc,
                  event_date: new Date(editEvDate).toISOString(),
                  location: editEvLoc,
                  capacity: editEvCap ? parseInt(editEvCap) : null
                }).eq('id', editingEvent.id)
                if (error) throw error
                setEditingEvent(null)
              } catch (err: any) {
                console.error('Error updating event:', err)
              }
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-500 mb-1">หัวข้อกิจกรรม *</label>
              <Input
                type="text"
                required
                value={editEvTitle}
                onChange={(e) => setEditEvTitle(e.target.value)}
                placeholder="เช่น การใช้สถิติเบื้องต้นในงานวิจัย"
                className="w-full light-input text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">รายละเอียด</label>
              <Textarea
                value={editEvDesc}
                onChange={(e) => setEditEvDesc(e.target.value)}
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
                  value={editEvDate}
                  onChange={(e) => setEditEvDate(e.target.value)}
                  className="w-full light-input text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">จำนวนที่รับ (คน)</label>
                <Input
                  type="number"
                  value={editEvCap}
                  onChange={(e) => setEditEvCap(e.target.value)}
                  placeholder="ไม่จำกัด"
                  className="w-full light-input text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">สถานที่จัดงาน</label>
              <Input
                type="text"
                value={editEvLoc}
                onChange={(e) => setEditEvLoc(e.target.value)}
                placeholder="เช่น ห้องประชุมอาคาร 3"
                className="w-full light-input text-xs"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none"
                style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
