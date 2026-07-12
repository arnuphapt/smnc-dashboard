import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { 
  Info, 
  CalendarPlus, 
  Calendar, 
  History, 
  Clock, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  AlertCircle
} from 'lucide-react'

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

const PageHeader: React.FC<{
  title: string
  subtitle: string
  tabs: { key: string; icon: React.ReactNode; label: string }[]
  activeTab: string
  onTabChange: (tab: string) => void
  extraBadge?: string
}> = ({ title, subtitle, tabs, activeTab, onTabChange, extraBadge }) => (
  <div
    className="relative overflow-hidden rounded-2xl mb-8"
    style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 60%, #0E3251 100%)' }}
  >
    {/* Subtle mesh overlay */}
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 80% 20%, rgba(14,165,160,0.25) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(14,165,160,0.12) 0%, transparent 50%)',
      }}
    />
    <div className="relative px-8 pt-8 pb-0">
      {extraBadge && (
        <span
          className="inline-block mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
          style={{ background: 'rgba(14,165,160,0.18)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.4)' }}
        >
          {extraBadge}
        </span>
      )}
      <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-1">{title}</h1>
      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>{subtitle}</p>

      {/* Tab Pills — float on bottom edge of header */}
      <div className="flex gap-2 mt-7 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all duration-200 shrink-0"
              style={{
                background: isActive ? '#F0F7FF' : 'rgba(255,255,255,0.07)',
                color: isActive ? '#0B1D3A' : 'rgba(255,255,255,0.65)',
                borderBottom: isActive ? '2px solid #0EA5A0' : '2px solid transparent',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  </div>
)

const ContentPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="bg-white rounded-2xl shadow-sm"
    style={{ border: '1px solid #E2EDF8', borderLeft: '4px solid #0EA5A0' }}
  >
    <div className="p-8">{children}</div>
  </div>
)

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
    pending: { bg: '#FFF8EC', color: '#B45309', icon: <Clock className="w-3.5 h-3.5" />, label: 'รอการยืนยัน' },
    confirmed: { bg: '#ECFDF5', color: '#065F46', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'ยืนยันแล้ว' },
    cancelled: { bg: '#FFF1F2', color: '#9F1239', icon: <XCircle className="w-3.5 h-3.5" />, label: 'ยกเลิก' },
    completed: { bg: '#EFF6FF', color: '#1E40AF', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'เสร็จสิ้น' },
  }
  const s = map[status] ?? { bg: '#F8FAFC', color: '#475569', icon: <HelpCircle className="w-3.5 h-3.5" />, label: status }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}22` }}
    >
      {s.icon} {s.label}
    </span>
  )
}

export const Clinic: React.FC = () => {
  const { user } = useAuth()
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'book' | 'events' | 'history'>('info')
  const [clinicDesc, setClinicDesc] = useState<string>('')
  
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [events, setEvents] = useState<ClinicEvent[]>([])

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDayEvents, setSelectedDayEvents] = useState<ClinicEvent[]>([])
  const [selectedDateStr, setSelectedDateStr] = useState<string>('')

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

  useEffect(() => { fetchClinicInfo(); fetchEvents() }, [user])
  useEffect(() => { if (activeSubTab === 'history') fetchAppointments() }, [activeSubTab, user])

  useEffect(() => {
    if (!user) return
    const a = supabase.channel('appt-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchAppointments()).subscribe()
    const e = supabase.channel('evnt-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_events' }, () => fetchEvents()).subscribe()
    const r = supabase.channel('reg-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => fetchEvents()).subscribe()
    return () => { supabase.removeChannel(a); supabase.removeChannel(e); supabase.removeChannel(r) }
  }, [user])

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setFormError(''); setFormSuccess(''); setIsSubmitting(true)
    if (!topic.trim()) { setFormError('กรุณากรอกหัวข้อปรึกษา'); setIsSubmitting(false); return }
    if (!date) { setFormError('กรุณาเลือกวันที่'); setIsSubmitting(false); return }
    try {
      const { error } = await supabase.from('appointments').insert({ requester_id: user.id, topic: topic.trim(), notes: notes.trim(), requested_at: new Date(`${date}T${time}`).toISOString(), status: 'pending' })
      if (error) throw error
      setFormSuccess('ส่งคำขอจองนัดหมายแล้ว! กรุณารอแอดมินยืนยันผลผ่านหน้าประวัติการจอง')
      setTopic(''); setNotes(''); setDate(''); setTime('09:00')
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

  const monthNamesThai = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
  const { firstDay, daysInMonth } = (() => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth()
    return { firstDay: new Date(y, m, 1).getDay(), daysInMonth: new Date(y, m + 1, 0).getDate() }
  })()

  const prevMonth = () => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); setSelectedDayEvents([]); setSelectedDateStr('') }
  const nextMonth = () => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); setSelectedDayEvents([]); setSelectedDateStr('') }

  const handleDayClick = (day: number) => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const dateKey = `${year}-${month}-${dayStr}`
    const dayEvents = events.filter(ev => {
      const d = new Date(ev.event_date)
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === dateKey
    })
    setSelectedDayEvents(dayEvents)
    setSelectedDateStr(`${day} ${monthNamesThai[currentDate.getMonth()]} ${currentDate.getFullYear() + 543}`)
  }

  const renderCalendarCells = () => {
    const cells = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} className="min-h-[64px]" style={{ background: '#F8FAFC', borderRight: '1px solid #E8F0F8', borderBottom: '1px solid #E8F0F8' }} />)
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
          className="min-h-[64px] flex flex-col p-2 text-left cursor-pointer transition-all duration-150 group"
          style={{
            background: isToday ? '#EFF6FF' : '#FFFFFF',
            borderRight: '1px solid #E8F0F8',
            borderBottom: '1px solid #E8F0F8',
          }}
        >
          <span
            className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
            style={{
              background: isToday ? '#0B1D3A' : 'transparent',
              color: isToday ? '#FFFFFF' : '#1E293B',
            }}
          >
            {day}
          </span>
          {dayEvents.length > 0 && (
            <div className="mt-1 flex flex-col gap-0.5 w-full overflow-hidden">
              {dayEvents.slice(0, 2).map((ev, idx) => (
                <div
                  key={idx}
                  className="text-[9px] px-1.5 py-0.5 rounded font-semibold truncate"
                  style={{ background: '#0EA5A0', color: '#FFFFFF' }}
                >
                  {ev.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-[8px] font-bold" style={{ color: '#0EA5A0' }}>+{dayEvents.length - 2}</div>
              )}
            </div>
          )}
        </button>
      )
    }
    return cells
  }

  const tabsConfig = [
    { key: 'info', icon: <Info className="w-4 h-4" />, label: 'เกี่ยวกับคลินิก' },
    { key: 'events', icon: <Calendar className="w-4 h-4" />, label: 'ปฏิทินกิจกรรม' },
    { key: 'book', icon: <CalendarPlus className="w-4 h-4" />, label: 'จองนัดปรึกษา' },
    { key: 'history', icon: <History className="w-4 h-4" />, label: 'ประวัติของฉัน' },
  ]

  const inputBase = "w-full text-sm px-4 py-2.5 rounded-xl focus:outline-none transition-all duration-200"
  const inputBorder = { border: '1.5px solid #CBD5E1' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      <PageHeader
        title="คลินิกวิจัย SMNC"
        subtitle="Research Clinic — ปรึกษา เรียนรู้ และพัฒนางานวิจัยร่วมกัน"
        extraBadge="Research Support Services"
        tabs={tabsConfig}
        activeTab={activeSubTab}
        onTabChange={(tab) => setActiveSubTab(tab as any)}
      />

      <ContentPanel>
        {/* TAB: INFO */}
        {activeSubTab === 'info' && (
          <div className="space-y-8">
            <div>
              <p
                className="text-xs font-extrabold uppercase tracking-[0.15em] mb-2"
                style={{ color: '#0EA5A0' }}
              >
                เกี่ยวกับเรา
              </p>
              <div className="text-base font-medium leading-relaxed whitespace-pre-line" style={{ color: '#334155' }}>
                {clinicDesc}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E8F0F8', paddingTop: '2rem' }}>
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] mb-5" style={{ color: '#0EA5A0' }}>
                บริการให้คำปรึกษา
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { title: 'ออกแบบและระเบียบวิธีวิจัย', desc: 'การตั้งสมมติฐาน เลือกประชากรกลุ่มตัวอย่าง และออกแบบคำถามวิจัย' },
                  { title: 'วิเคราะห์ข้อมูลและสถิติ', desc: 'แนะนำสถิติพื้นฐาน สถิติขั้นสูง และโปรแกรมประมวลผลข้อมูล' },
                  { title: 'จริยธรรม & ทรัพย์สินทางปัญญา', desc: 'ขั้นตอนตรวจสอบ แก้ไข และแบบฟอร์มยื่นตามมาตรฐาน' },
                ].map((s) => (
                  <div
                    key={s.title}
                    className="p-5 rounded-2xl transition-all duration-200 hover:-translate-y-1"
                    style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}
                  >
                    <div
                      className="w-8 h-1 rounded-full mb-4"
                      style={{ background: 'linear-gradient(90deg, #0EA5A0, #0B1D3A)' }}
                    />
                    <h5 className="font-bold text-sm mb-2" style={{ color: '#0B1D3A' }}>{s.title}</h5>
                    <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: EVENTS */}
        {activeSubTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-extrabold" style={{ color: '#0B1D3A' }}>
                  {monthNamesThai[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                </h3>
                <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}>
                  <button onClick={prevMonth} className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white" style={{ color: '#0B1D3A' }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white" style={{ color: '#0B1D3A' }}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: '#94A3B8' }}>
                {['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'].map(d => <div key={d} className="py-1">{d}</div>)}
              </div>

              {/* Grid */}
              <div
                className="grid grid-cols-7 rounded-xl overflow-hidden"
                style={{ border: '1px solid #E8F0F8', borderRight: 'none', borderBottom: 'none' }}
              >
                {renderCalendarCells()}
              </div>
            </div>

            {/* Day Detail Panel */}
            <div className="rounded-2xl p-5 flex flex-col" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-4" style={{ color: '#0EA5A0' }}>
                {selectedDateStr ? selectedDateStr : 'เลือกวันที่บนปฏิทิน'}
              </p>

              {selectedDayEvents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-3">
                  <Calendar className="w-10 h-10 stroke-[1.5]" style={{ color: '#CBD5E1' }} />
                  <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                    {selectedDateStr ? 'ไม่มีกิจกรรมในวันนี้' : 'คลิกวันใดบนปฏิทินเพื่อดูกิจกรรม'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {selectedDayEvents.map((ev) => (
                    <div key={ev.id} className="p-4 bg-white rounded-xl space-y-3" style={{ border: '1px solid #DAEEFF' }}>
                      <div>
                        <span
                          className="inline-block text-[9px] font-extrabold uppercase tracking-[0.1em] px-2.5 py-0.5 rounded-full mb-2"
                          style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.3)' }}
                        >
                          สัมมนา / อบรม
                        </span>
                        <h5 className="font-bold text-sm leading-snug" style={{ color: '#0B1D3A' }}>{ev.title}</h5>
                        {ev.description && <p className="text-xs mt-1" style={{ color: '#64748B' }}>{ev.description}</p>}
                      </div>
                      <div className="space-y-1.5 text-xs font-medium" style={{ borderTop: '1px solid #F0F7FF', paddingTop: '0.75rem', color: '#475569' }}>
                        {ev.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" style={{ color: '#0EA5A0' }} />
                            {ev.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" style={{ color: '#0EA5A0' }} />
                          ที่นั่ง: {ev.registered_count} / {ev.capacity ?? 'ไม่จำกัด'}
                        </div>
                      </div>
                      {user ? (
                        <button
                          onClick={() => handleEventRegistration(ev.id, ev.is_registered || false)}
                          disabled={!ev.is_registered && ev.capacity ? (ev.registered_count || 0) >= ev.capacity : false}
                          className="w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200"
                          style={ev.is_registered
                            ? { background: '#FFF1F2', color: '#9F1239', border: '1px solid #FECDD3' }
                            : { background: '#0B1D3A', color: '#FFFFFF' }}
                        >
                          {ev.is_registered ? 'ยกเลิกการลงทะเบียน' : 'ลงทะเบียนเข้าร่วม'}
                        </button>
                      ) : (
                        <div className="w-full py-2 text-center text-[10px] font-bold rounded-xl" style={{ background: '#F8FAFC', color: '#94A3B8', border: '1px dashed #CBD5E1' }}>
                          เข้าสู่ระบบเพื่อลงทะเบียน
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-start gap-1.5 text-[10px] font-medium" style={{ color: '#94A3B8', borderTop: '1px solid #DAEEFF', paddingTop: '1rem' }}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                กิจกรรมอาจมีการปรับเปลี่ยน โปรดติดต่องานวิจัยสถาบันเพื่อยืนยัน
              </div>
            </div>
          </div>
        )}

        {/* TAB: BOOK */}
        {activeSubTab === 'book' && (
          <div className="max-w-xl mx-auto">
            {!user ? (
              <div className="text-center py-16 flex flex-col items-center gap-4" style={{ border: '2px dashed #CBD5E1', borderRadius: '1rem' }}>
                <CalendarPlus className="w-12 h-12 stroke-[1.5]" style={{ color: '#CBD5E1' }} />
                <div>
                  <h4 className="text-sm font-bold" style={{ color: '#0B1D3A' }}>เข้าสู่ระบบเพื่อจองนัด</h4>
                  <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>จำเป็นต้องลงชื่อเข้าใช้ก่อนส่งคำขอนัดปรึกษา</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-6">
                <div>
                  <h3 className="text-base font-black mb-1" style={{ color: '#0B1D3A' }}>ส่งคำขอนัดปรึกษา</h3>
                  <p className="text-xs font-medium" style={{ color: '#64748B' }}>เจ้าหน้าที่จะยืนยันนัดหมายและติดต่อกลับโดยเร็ว</p>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold" style={{ background: '#FFF1F2', color: '#9F1239', border: '1px solid #FECDD3' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                    <CheckCircle className="w-4 h-4 shrink-0" /> {formSuccess}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>หัวข้อที่ขอปรึกษา *</label>
                    <input
                      type="text"
                      placeholder="เช่น ขอบข่ายทฤษฎีวิจัย หรือ การใช้โปรแกรม SPSS..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className={inputBase}
                      style={{ ...inputBorder, background: '#FAFCFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>รายละเอียดเพิ่มเติม</label>
                    <textarea
                      rows={3}
                      placeholder="เขียนรายละเอียดเพิ่มเติมเพื่อให้ทีมเตรียมตัวได้ล่วงหน้า..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={inputBase + ' resize-none'}
                      style={{ ...inputBorder, background: '#FAFCFF' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>วันที่ขอนัด *</label>
                      <input
                        type="date"
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)}
                        className={inputBase}
                        style={{ ...inputBorder, background: '#FAFCFF' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>ช่วงเวลา *</label>
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className={inputBase + ' cursor-pointer'}
                        style={{ ...inputBorder, background: '#FAFCFF' }}
                      >
                        <option value="09:00">09:00 – 10:00 (เช้า)</option>
                        <option value="10:00">10:00 – 11:00 (เช้า)</option>
                        <option value="11:00">11:00 – 12:00 (เช้า)</option>
                        <option value="13:00">13:00 – 14:00 (บ่าย)</option>
                        <option value="14:00">14:00 – 15:00 (บ่าย)</option>
                        <option value="15:00">15:00 – 16:00 (บ่าย)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)', color: '#FFFFFF' }}
                >
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอนัดหมาย →'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB: HISTORY */}
        {activeSubTab === 'history' && (
          <div>
            {!user ? (
              <div className="text-center py-16 flex flex-col items-center gap-4" style={{ border: '2px dashed #CBD5E1', borderRadius: '1rem' }}>
                <History className="w-12 h-12 stroke-[1.5]" style={{ color: '#CBD5E1' }} />
                <div>
                  <h4 className="text-sm font-bold" style={{ color: '#0B1D3A' }}>เข้าสู่ระบบเพื่อดูประวัติ</h4>
                  <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>จำเป็นต้องลงชื่อเข้าใช้ก่อนดูประวัติการนัดหมาย</p>
                </div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-3">
                <History className="w-10 h-10 stroke-[1.5]" style={{ color: '#CBD5E1' }} />
                <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>ยังไม่มีประวัติการจองนัดหมาย</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #E8F0F8' }}>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr style={{ background: '#F0F7FF', borderBottom: '1px solid #DAEEFF' }}>
                      {['หัวข้อปรึกษา','วันเวลานัด','หมายเหตุ','สถานะ','ความเห็น Admin'].map(h => (
                        <th key={h} className="py-3 px-4 font-extrabold uppercase text-[10px] tracking-wider" style={{ color: '#64748B' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#E8F0F8' }}>
                    {appointments.map((app) => {
                      const d = new Date(app.requested_at)
                      const fmt = `${d.getDate()} ${monthNamesThai[d.getMonth()]} ${d.getFullYear() + 543} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
                      return (
                        <tr key={app.id} className="transition-colors hover:bg-blue-50/30">
                          <td className="py-3 px-4 font-bold" style={{ color: '#0B1D3A' }}>{app.topic}</td>
                          <td className="py-3 px-4 font-medium" style={{ color: '#475569' }}>{fmt}</td>
                          <td className="py-3 px-4 max-w-[160px] truncate" style={{ color: '#64748B' }} title={app.notes}>{app.notes || '—'}</td>
                          <td className="py-3 px-4"><StatusBadge status={app.status} /></td>
                          <td className="py-3 px-4 italic font-medium" style={{ color: '#64748B' }}>{app.admin_notes || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </ContentPanel>
    </div>
  )
}
