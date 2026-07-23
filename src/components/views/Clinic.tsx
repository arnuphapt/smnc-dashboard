'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

const supabase = createClient()
import {
  CalendarPlus,
  History,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  AlertCircle,
  FlaskConical,
  BarChart3,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Headphones
} from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { PageHeader, ContentPanel, SectionHeader } from '@/components/PageHeader'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ClinicEvent {
  id: string
  title: string
  description?: string
  event_date: string
  location?: string
  capacity?: number
  registered_count?: number
  is_registered?: boolean
}

interface Appointment {
  id: string
  topic: string
  notes?: string
  requested_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  admin_notes?: string
  created_at: string
}

const monthNamesThai = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']

export const Clinic: React.FC = () => {
  const { user } = useAuth()
  const [clinicDesc, setClinicDesc] = useState<string>('')

  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [time, setTime] = useState('09:00')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [events, setEvents] = useState<ClinicEvent[]>([])

  const [currentDate, setCurrentDate] = useState(new Date())

  // Clicking a calendar date opens this modal — it replaces the old always-visible
  // "book a consultation" section, showing that day's workshops (if any) plus a
  // booking form scoped to the clicked date instead of a free-text date field.
  const [dayModalOpen, setDayModalOpen] = useState(false)
  const [selectedDateKey, setSelectedDateKey] = useState<string>('')
  const [selectedDateStr, setSelectedDateStr] = useState<string>('')
  const [selectedDayEvents, setSelectedDayEvents] = useState<ClinicEvent[]>([])
  const [selectedIsPast, setSelectedIsPast] = useState(false)

  const fetchClinicInfo = async () => {
    try {
      const { data } = await supabase.from('clinic_info').select('value').eq('key', 'description').maybeSingle()
      setClinicDesc(data?.value || 'ยินดีต้อนรับสู่ คลินิกวิจัย (SMNC Research Clinic) แหล่งรวมข้อมูลและบริการคำปรึกษางานวิจัย')
    } catch (err) { console.error(err) }
  }

  const fetchAppointments = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('appointments').select('*').order('requested_at', { ascending: false })
      if (error) throw error
      if (data) setAppointments(data as Appointment[])
    } catch (err) { console.error(err) }
  }

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase.from('clinic_events').select('*').order('event_date', { ascending: true })
      if (eventsError) throw eventsError
      if (!eventsData) return
      const formattedEvents: ClinicEvent[] = []
      for (const ev of eventsData) {
        const { count } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', ev.id)
        let userRegistered = false
        if (user) {
          const { data: userReg } = await supabase.from('event_registrations').select('id').eq('event_id', ev.id).eq('user_id', user.id).maybeSingle()
          if (userReg) userRegistered = true
        }
        formattedEvents.push({ id: ev.id, title: ev.title, description: ev.description, event_date: ev.event_date, location: ev.location, capacity: ev.capacity, registered_count: count || 0, is_registered: userRegistered })
      }
      setEvents(formattedEvents)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchClinicInfo(); fetchEvents(); fetchAppointments() }, [user])

  useEffect(() => {
    if (!user) return
    const a = supabase.channel('appt-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchAppointments()).subscribe()
    const e = supabase.channel('evnt-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_events' }, () => fetchEvents()).subscribe()
    const r = supabase.channel('reg-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => fetchEvents()).subscribe()
    return () => { supabase.removeChannel(a); supabase.removeChannel(e); supabase.removeChannel(r) }
  }, [user])

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedDateKey) return
    setFormError(''); setFormSuccess(''); setIsSubmitting(true)
    if (!topic.trim()) { setFormError('กรุณากรอกหัวข้อปรึกษา'); setIsSubmitting(false); return }
    try {
      const { error } = await supabase.from('appointments').insert({ requester_id: user.id, topic: topic.trim(), notes: notes.trim(), requested_at: new Date(`${selectedDateKey}T${time}`).toISOString(), status: 'pending' })
      if (error) throw error
      setFormSuccess('ส่งคำขอจองนัดหมายแล้ว! กรุณารอแอดมินยืนยันผลผ่านหัวข้อประวัติการจอง')
      setTopic(''); setNotes(''); setTime('09:00')
    } catch (err: any) { setFormError(err.message || 'เกิดข้อผิดพลาด') } finally { setIsSubmitting(false) }
  }

  const handleEventRegistration = async (eventId: string, isRegistered: boolean) => {
    if (!user) return
    try {
      if (isRegistered) {
        await supabase.from('event_registrations').delete().eq('event_id', eventId).eq('user_id', user.id)
      } else {
        await supabase.from('event_registrations').insert({ event_id: eventId, user_id: user.id })
      }
      fetchEvents()
    } catch (err) { console.error(err) }
  }

  const { firstDay, daysInMonth } = (() => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth()
    return { firstDay: new Date(y, m, 1).getDay(), daysInMonth: new Date(y, m + 1, 0).getDate() }
  })()

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  // Shared by clicking a calendar cell and the standalone "จองนัดหมาย" button
  // (which always opens on today, regardless of which month is on screen).
  const openDayModal = (year: number, month0: number, day: number) => {
    const month = String(month0 + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const dateKey = `${year}-${month}-${dayStr}`
    const dayEvents = events.filter(ev => {
      const d = new Date(ev.event_date)
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === dateKey
    })
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const clicked = new Date(year, month0, day)

    setSelectedDateKey(dateKey)
    setSelectedDateStr(`${day} ${monthNamesThai[month0]} ${year + 543}`)
    setSelectedDayEvents(dayEvents)
    setSelectedIsPast(clicked < today)
    setFormError(''); setFormSuccess(''); setTopic(''); setNotes(''); setTime('09:00')
    setDayModalOpen(true)
  }

  const handleDayClick = (day: number) => openDayModal(currentDate.getFullYear(), currentDate.getMonth(), day)

  const handleBookNowClick = () => {
    const now = new Date()
    openDayModal(now.getFullYear(), now.getMonth(), now.getDate())
  }

  const renderCalendarCells = () => {
    const cells: React.ReactNode[] = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} className="min-h-[76px] bg-[#F8FAFC] border-r border-b border-[#E2E8F0]" />)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const dayStr = String(day).padStart(2, '0')
      const dateKey = `${year}-${month}-${dayStr}`
      const dayEvents = events.filter(ev => {
        const d = new Date(ev.event_date)
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === dateKey
      })
      const isToday = new Date().toDateString() === new Date(year, currentDate.getMonth(), day).toDateString()

      cells.push(
        <button
          key={`d-${day}`}
          onClick={() => handleDayClick(day)}
          className={`group min-h-[76px] flex flex-col p-2 text-left cursor-pointer transition-colors duration-150 border-r border-b border-[#E2E8F0] ${
            isToday ? 'bg-[#FFF8E7]' : 'bg-white hover:bg-[#F2F8F7]'
          }`}
        >
          <span
            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors duration-150 ${
              isToday ? 'bg-[#00796B] text-white font-extrabold shadow-xs' : 'text-[#0F172A] group-hover:bg-[#00796B] group-hover:text-white'
            }`}
          >
            {day}
          </span>
          {dayEvents.length > 0 && (
            <div className="mt-1 flex flex-col gap-0.5 w-full overflow-hidden">
              {dayEvents.slice(0, 2).map((ev, idx) => (
                <div
                  key={idx}
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-extrabold truncate bg-[#00796B] text-white shadow-xs"
                >
                  {ev.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-[8px] font-mono font-bold text-[#00796B]">+{dayEvents.length - 2}</div>
              )}
            </div>
          )}
        </button>
      )
    }
    return cells
  }

  const inputBase = "w-full text-sm px-4 py-2.5 rounded-xl focus:outline-none transition-all duration-200"
  const inputBorder = { border: '1.5px solid #CBD5E1' }

  return (
    <div className="flex-1 space-y-6 animate-fadeIn">
      <PageHeader
        title="คลินิกวิจัย SMNC"
        subtitle="Research Clinic — ปรึกษา เรียนรู้ และพัฒนางานวิจัยร่วมกัน"
        extraBadge="Research Support Services"
      />

      {/* SECTION: INFO */}
      <ContentPanel>
        {/* HERO BANNER FOR ABOUT CLINIC (Light Bright Tone) */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#F0FDF4] via-[#F2F8F7] to-[#F0F7FF] border border-[#D1E5E3] text-[#0F172A] shadow-flip-card">
          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D1E5E3] pb-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF8E7] text-[#D97706] border border-[#FCD34D] text-xs font-mono font-black tracking-wide shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SMNC RESEARCH SUPPORT CENTER</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                  เกี่ยวกับคลินิกวิจัย
                </h2>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full border border-[#E2E8F0] text-xs shadow-xs">
                <div className="p-2 rounded-full bg-[#FFF8E7] text-[#D97706] font-black">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-[#0F172A]">บริการให้คำปรึกษาแบบ 1-on-1</div>
                  <div className="text-[11px] text-[#64748B] font-semibold">โดยอาจารย์และผู้เชี่ยวชาญ คณะพยาบาลศาสตร์</div>
                </div>
              </div>
            </div>

            <p className="text-sm sm:text-base font-semibold leading-relaxed text-[#334155] whitespace-pre-line max-w-4xl">
              {clinicDesc}
            </p>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {[
                'ออกแบบระเบียบวิธีวิจัย',
                'วิเคราะห์สถิติ & โปรแกรมประมวลผล',
                'การยื่นขอจริยธรรมการวิจัย (IRB)',
                'เตรียมต้นฉบับเพื่อตีพิมพ์',
                'สืบค้นวารสารตรงสาขา'
              ].map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-[#D1E5E3] text-xs font-extrabold text-[#0F172A] hover:bg-[#F2F8F7] transition-all shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00796B] shrink-0" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* SERVICES CARDS */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-black uppercase tracking-widest text-[#00796B]">Service Categories</p>
              <h3 className="text-lg font-black text-[#0F172A]">ขอบเขตบริการให้คำปรึกษา</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: FlaskConical,
                title: 'ออกแบบและระเบียบวิธีวิจัย',
                subtitle: 'Research Methodology',
                desc: 'การตั้งสมมติฐาน เลือกประชากรกลุ่มตัวอย่าง และออกแบบเครื่องมือวิจัยให้สอดคล้องตามมาตรฐานสากล',
                borderColor: 'border-[#E2E8F0] hover:border-[#00796B]',
                iconBg: 'bg-[#F0F7FF] text-[#00796B]'
              },
              {
                icon: BarChart3,
                title: 'วิเคราะห์ข้อมูลและสถิติ',
                subtitle: 'Data & Statistical Analysis',
                desc: 'แนะนำสถิติพื้นฐาน สถิติขั้นสูง โปรแกรมประมวลผลข้อมูล (SPSS, R, jamovi) และการแปลผลการวิจัย',
                borderColor: 'border-[#E2E8F0] hover:border-[#F59E0B]',
                iconBg: 'bg-[#FFF8E7] text-[#D97706]'
              },
              {
                icon: ShieldCheck,
                title: 'จริยธรรม & ทรัพย์สินทางปัญญา',
                subtitle: 'Research Ethics & IP',
                desc: 'ขั้นตอนตรวจสอบ แก้ไขแบบฟอร์มยื่นจริยธรรมการวิจัยในมนุษย์ (IRB) และการคุ้มครองทรัพย์สินทางปัญญา',
                borderColor: 'border-[#E2E8F0] hover:border-[#0284C7]',
                iconBg: 'bg-[#E0F2FE] text-[#0284C7]'
              },
            ].map((s) => {
              const IconComp = s.icon
              return (
                <div
                  key={s.title}
                  className={`group relative p-6 rounded-3xl bg-white border ${s.borderColor} shadow-flip-card hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden`}
                >
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl ${s.iconBg} flex items-center justify-center font-bold shadow-xs`}>
                        <IconComp className="w-6 h-6 stroke-[2]" />
                      </div>
                      <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#64748B]">
                        SMNC Service
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-base text-[#0F172A] group-hover:text-[#00796B] transition-colors">
                        {s.title}
                      </h4>
                      <p className="text-[11px] font-bold text-[#64748B] mt-0.5">
                        {s.subtitle}
                      </p>
                    </div>

                    <p className="text-xs leading-relaxed text-[#475569] font-semibold">
                      {s.desc}
                    </p>
                  </div>

                  <div className="relative z-10 pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-extrabold text-[#00796B]">
                    <span>จองคิวรับคำปรึกษา</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </ContentPanel>

      {/* SECTION: CALENDAR + HISTORY — booking history sits beside the calendar, not in its own section */}
      <ContentPanel>
        <SectionHeader eyebrow="กิจกรรม" title="ปฏิทินกิจกรรม" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-[#0F172A]">
                {monthNamesThai[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold text-[#64748B] hidden sm:block">คลิกวันที่เพื่อดูกิจกรรมหรือจองคิวปรึกษา</p>
                <div className="flex items-center gap-1 rounded-xl p-1 bg-[#F8FAFC] border border-[#E2E8F0]">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white text-[#0F172A]">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white text-[#0F172A]">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-extrabold uppercase tracking-wider mb-1 text-[#64748B]">
              {['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'].map(d => <div key={d} className="py-1">{d}</div>)}
            </div>

            <div
              className="grid grid-cols-7 rounded-2xl overflow-hidden border border-[#E2E8F0]"
            >
              {renderCalendarCells()}
            </div>
          </div>

          {/* Booking history — right rail beside the calendar */}
          <div className="rounded-3xl p-5 flex flex-col bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#64748B]">ของฉัน</p>
                <h4 className="text-sm font-black text-[#0F172A]">ประวัติการจองนัดหมาย</h4>
              </div>
              {user && (
                <Button
                  onClick={handleBookNowClick}
                  className="shrink-0 h-auto py-2 px-3.5 rounded-full text-xs font-extrabold btn-primary"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  จองนัดหมาย
                </Button>
              )}
            </div>

            {!user ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-6">
                <History className="w-8 h-8 stroke-[1.5] text-[#94A3B8]" />
                <p className="text-[10px] font-semibold text-[#64748B]">เข้าสู่ระบบเพื่อดูประวัติการนัดหมาย</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-6">
                <History className="w-8 h-8 stroke-[1.5] text-[#94A3B8]" />
                <p className="text-[10px] font-semibold text-[#64748B]">ยังไม่มีประวัติการจองนัดหมาย</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {appointments.map((app) => {
                  const d = new Date(app.requested_at)
                  const fmt = `${d.getDate()} ${monthNamesThai[d.getMonth()].slice(0, 3)} ${d.getFullYear() + 543} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
                  return (
                    <div key={app.id} className="p-3.5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-extrabold text-xs leading-snug truncate text-[#0F172A]" title={app.topic}>{app.topic}</h5>
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                      <p className="text-[10px] font-medium text-[#64748B] mt-1">{fmt}</p>
                      {app.notes && <p className="text-[10px] mt-1 text-[#64748B] truncate" title={app.notes}>{app.notes}</p>}
                      {app.admin_notes && <p className="text-[10px] mt-1 italic text-[#64748B]">หมายเหตุ: {app.admin_notes}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </ContentPanel>

      {/* MODAL: date detail — workshops that day + book a consultation for that date */}
      <Dialog open={dayModalOpen} onOpenChange={setDayModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#64748B]">วันที่เลือก</p>
            <DialogTitle className="header-display text-lg font-black text-[#0F172A]">{selectedDateStr}</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
            {/* Workshops that day */}
            {selectedDayEvents.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">กิจกรรมวันนี้</p>
                {selectedDayEvents.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-2xl space-y-3 bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div>
                      <span
                        className="inline-block text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2 bg-[#F0F7FF] text-[#00796B] border border-[#DAEEFF]"
                      >
                        สัมมนา / อบรม
                      </span>
                      <h5 className="font-extrabold text-sm leading-snug text-[#0F172A]">{ev.title}</h5>
                      {ev.description && <p className="text-xs mt-1 text-[#64748B]">{ev.description}</p>}
                    </div>
                    <div className="space-y-1.5 text-xs font-medium border-t border-[#E2E8F0] pt-3 text-[#475569]">
                      {ev.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#00796B]" />
                          {ev.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#00796B]" />
                        ที่นั่ง: {ev.registered_count} / {ev.capacity ?? 'ไม่จำกัด'}
                      </div>
                    </div>
                    {user ? (
                      <button
                        onClick={() => handleEventRegistration(ev.id, ev.is_registered || false)}
                        disabled={!ev.is_registered && ev.capacity ? (ev.registered_count || 0) >= ev.capacity : false}
                        className={`w-full py-2.5 rounded-full text-xs font-extrabold cursor-pointer transition-all duration-200 ${
                          ev.is_registered
                            ? 'bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]'
                            : 'btn-primary'
                        }`}
                      >
                        {ev.is_registered ? 'ยกเลิกการลงทะเบียน' : 'ลงทะเบียนเข้าร่วม'}
                      </button>
                    ) : (
                      <div className="w-full py-2 text-center text-[10px] font-bold rounded-xl bg-[#F8FAFC] text-[#94A3B8] border border-dashed border-[#CBD5E1]">
                        เข้าสู่ระบบเพื่อลงทะเบียน
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Book a consultation for this date */}
            {selectedIsPast ? (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs font-medium bg-[#F8FAFC] text-[#94A3B8] border border-dashed border-[#CBD5E1]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                วันที่นี้ผ่านมาแล้ว ไม่สามารถจองคิวปรึกษาย้อนหลังได้ — เลือกวันที่ในอนาคตแทน
              </div>
            ) : !user ? (
              <div className="text-center py-8 flex flex-col items-center gap-3 border-2 border-dashed border-[#CBD5E1] rounded-2xl">
                <CalendarPlus className="w-9 h-9 stroke-[1.5] text-[#CBD5E1]" />
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">เข้าสู่ระบบเพื่อจองนัด</h4>
                  <p className="text-[10px] mt-1 text-[#94A3B8]">จำเป็นต้องลงชื่อเข้าใช้ก่อนส่งคำขอนัดปรึกษา</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4">
                <div className={selectedDayEvents.length > 0 ? 'border-t border-[#E2E8F0] pt-4' : undefined}>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider mb-1 text-[#64748B]">จองคิวปรึกษาวันนี้</p>
                  <p className="text-xs font-semibold text-[#64748B]">เจ้าหน้าที่จะยืนยันนัดหมายและติดต่อกลับโดยเร็ว</p>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {formSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">หัวข้อที่ขอปรึกษา *</label>
                  <Input
                    type="text"
                    placeholder="เช่น ขอบข่ายทฤษฎีวิจัย หรือ การใช้โปรแกรม SPSS..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={inputBase}
                    style={{ ...inputBorder, background: '#FAFCFF' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">รายละเอียดเพิ่มเติม</label>
                  <Textarea
                    rows={2}
                    placeholder="เขียนรายละเอียดเพิ่มเติมเพื่อให้ทีมเตรียมตัวได้ล่วงหน้า..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={inputBase + ' resize-none'}
                    style={{ ...inputBorder, background: '#FAFCFF' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">ช่วงเวลา *</label>
                  <Select
                    value={time}
                    onValueChange={(v) => setTime(v ?? '09:00')}
                    items={[
                      { value: '09:00', label: '09:00 – 10:00 (เช้า)' },
                      { value: '10:00', label: '10:00 – 11:00 (เช้า)' },
                      { value: '11:00', label: '11:00 – 12:00 (เช้า)' },
                      { value: '13:00', label: '13:00 – 14:00 (บ่าย)' },
                      { value: '14:00', label: '14:00 – 15:00 (บ่าย)' },
                      { value: '15:00', label: '15:00 – 16:00 (บ่าย)' },
                    ]}
                  >
                    <SelectTrigger className={inputBase + ' w-full'} style={{ ...inputBorder, background: '#FAFCFF' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00">09:00 – 10:00 (เช้า)</SelectItem>
                      <SelectItem value="10:00">10:00 – 11:00 (เช้า)</SelectItem>
                      <SelectItem value="11:00">11:00 – 12:00 (เช้า)</SelectItem>
                      <SelectItem value="13:00">13:00 – 14:00 (บ่าย)</SelectItem>
                      <SelectItem value="14:00">14:00 – 15:00 (บ่าย)</SelectItem>
                      <SelectItem value="15:00">15:00 – 16:00 (บ่าย)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 h-auto rounded-full text-xs font-extrabold disabled:opacity-50 btn-primary"
                >
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอนัดหมาย →'}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
