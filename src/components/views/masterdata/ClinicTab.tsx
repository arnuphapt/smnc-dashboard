'use client'

import React, { useState } from 'react'
import { Trash2, Calendar, Edit2, Plus, Clock, MapPin, Users } from 'lucide-react'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
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
        <div className="space-y-0.5">
          <div className="font-extrabold text-[#0F172A]">{ev.title}</div>
          {ev.description && <div className="text-[11px] text-[#64748B] line-clamp-1">{ev.description}</div>}
        </div>
      )
    },
    {
      key: 'event_date',
      header: 'วันเวลาจัดงาน',
      render: (ev) => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F6F5] text-[#00796B] border border-[#BCE5E2] text-[11px] font-bold">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{new Date(ev.event_date).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
      )
    },
    {
      key: 'location',
      header: 'สถานที่',
      render: (ev) => (
        <div className="flex items-center gap-1 text-[#475569] font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{ev.location || '—'}</span>
        </div>
      )
    },
    {
      key: 'capacity',
      header: 'จำนวนที่รับ',
      align: 'center',
      render: (ev) => (
        <div className="flex items-center justify-center gap-1 font-mono text-xs text-slate-600 font-bold">
          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{ev.capacity ? `${ev.capacity} คน` : 'ไม่จำกัด'}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'center',
      render: (ev) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingEvent(ev)
              setEditEvTitle(ev.title)
              setEditEvDesc(ev.description || '')
              setEditEvDate(ev.event_date ? new Date(ev.event_date).toISOString().substring(0, 16) : '')
              setEditEvLoc(ev.location || '')
              setEditEvCap(ev.capacity ? String(ev.capacity) : '')
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-xs cursor-pointer bg-[#F0F7FF] text-[#0EA5A0] border-[#DAEEFF]"
          >
            <Edit2 className="w-3 h-3" />
            แก้ไข
          </button>
          <button
            type="button"
            onClick={() => onDeleteEvent(ev.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-xs cursor-pointer bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]"
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
      <DataTable
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
        <DialogContent className="max-w-[480px] w-full p-6 space-y-4 rounded-3xl shadow-2xl border border-[#E2E8F0] bg-white animate-fadeIn">
          <div>
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] mb-1 text-[#00796B]">คอร์สสัมมนา</p>
            <DialogTitle className="text-base font-black text-[#0F172A] leading-snug">
              เพิ่มกิจกรรมสัมมนา / Workshop
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B] font-semibold">
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
              <label className="block font-extrabold text-[#0F172A] mb-1">หัวข้อกิจกรรม *</label>
              <Input
                type="text"
                required
                value={newEvTitle}
                onChange={(e) => setNewEvTitle(e.target.value)}
                placeholder="เช่น การใช้สถิติเบื้องต้นในงานวิจัย"
                className="w-full text-xs px-3.5 py-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]"
              />
            </div>
            <div>
              <label className="block font-extrabold text-[#0F172A] mb-1">รายละเอียด</label>
              <Textarea
                value={newEvDesc}
                onChange={(e) => setNewEvDesc(e.target.value)}
                placeholder="อธิบายกิจกรรมคร่าวๆ..."
                className="w-full text-xs px-3.5 py-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-extrabold text-[#0F172A] mb-1">วันเวลาจัดงาน *</label>
                <Input
                  type="datetime-local"
                  required
                  value={newEvDate}
                  onChange={(e) => setNewEvDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block font-extrabold text-[#0F172A] mb-1">จำนวนที่รับ (คน)</label>
                <Input
                  type="number"
                  value={newEvCap}
                  onChange={(e) => setNewEvCap(e.target.value)}
                  placeholder="ไม่จำกัด"
                  className="w-full text-xs px-3.5 py-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]"
                />
              </div>
            </div>
            <div>
              <label className="block font-extrabold text-[#0F172A] mb-1">สถานที่จัดงาน</label>
              <Input
                type="text"
                value={newEvLoc}
                onChange={(e) => setNewEvLoc(e.target.value)}
                placeholder="เช่น ห้องประชุมอาคาร 3"
                className="w-full text-xs px-3.5 py-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]"
              />
            </div>

            <div className="flex items-center gap-3 justify-end pt-3 border-t border-[#E2E8F0]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddEventOpen(false)}
                className="rounded-full text-xs font-bold px-5"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                className="btn-primary rounded-full text-xs font-extrabold px-6"
              >
                บันทึกกิจกรรม
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-[480px] w-full p-6 space-y-4 rounded-3xl shadow-2xl border border-[#E2E8F0] bg-white animate-fadeIn">
          <div>
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] mb-1 text-[#00796B]">คอร์สสัมมนา</p>
            <DialogTitle className="text-base font-black text-[#0F172A] leading-snug">
              แก้ไขกิจกรรมสัมมนา / Workshop
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B] font-semibold">
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
              <label className="block font-extrabold text-[#0F172A] mb-1">หัวข้อกิจกรรม *</label>
              <Input
                type="text"
                required
                value={editEvTitle}
                onChange={(e) => setEditEvTitle(e.target.value)}
                placeholder="เช่น การใช้สถิติเบื้องต้นในงานวิจัย"
                className="w-full text-xs px-3.5 py-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]"
              />
            </div>
            <div>
              <label className="block font-extrabold text-[#0F172A] mb-1">รายละเอียด</label>
              <Textarea
                value={editEvDesc}
                onChange={(e) => setEditEvDesc(e.target.value)}
                placeholder="อธิบายกิจกรรมคร่าวๆ..."
                className="w-full text-xs px-3.5 py-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-extrabold text-[#0F172A] mb-1">วันเวลาจัดงาน *</label>
                <Input
                  type="datetime-local"
                  required
                  value={editEvDate}
                  onChange={(e) => setEditEvDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block font-extrabold text-[#0F172A] mb-1">จำนวนที่รับ (คน)</label>
                <Input
                  type="number"
                  value={editEvCap}
                  onChange={(e) => setEditEvCap(e.target.value)}
                  placeholder="ไม่จำกัด"
                  className="w-full text-xs px-3.5 py-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]"
                />
              </div>
            </div>
            <div>
              <label className="block font-extrabold text-[#0F172A] mb-1">สถานที่จัดงาน</label>
              <Input
                type="text"
                value={editEvLoc}
                onChange={(e) => setEditEvLoc(e.target.value)}
                placeholder="เช่น ห้องประชุมอาคาร 3"
                className="w-full text-xs px-3.5 py-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]"
              />
            </div>

            <div className="flex items-center gap-3 justify-end pt-3 border-t border-[#E2E8F0]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingEvent(null)}
                className="rounded-full text-xs font-bold px-5"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                className="btn-primary rounded-full text-xs font-extrabold px-6"
              >
                บันทึกการแก้ไข
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
