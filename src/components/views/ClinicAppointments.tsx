'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth, Profile } from '@/context/AuthContext'
import { hasRole } from '@/utils/roleHelper'

const supabase = createClient()
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarPlus,
  Edit2,
  FileText,
  Search,
  CheckCircle,
  HelpCircle,
  UserCheck,
} from 'lucide-react'
import { PageHeader, ContentPanel, SectionHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import { SidePanel, FieldLabel } from '@/components/SidePanel'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface Appointment {
  id: string
  requester_id: string
  topic: string
  notes?: string
  requested_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  admin_notes?: string
  created_at: string
  profiles?: { email?: string; role?: string }
}

export const ClinicAppointments: React.FC = () => {
  const { user, profile } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all')

  // Edit / Manage SidePanel State
  const [editingApp, setEditingApp] = useState<Appointment | null>(null)
  const [statusInput, setStatusInput] = useState<string>('pending')
  const [notesInput, setNotesInput] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Confirm dialog state for canceling by requester
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [appToCancel, setAppToCancel] = useState<Appointment | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertText, setAlertText] = useState({ title: '', desc: '' })

  const isStaff = hasRole(profile?.role, 'admin') || hasRole(profile?.role, 'expert')

  const fetchProfiles = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*')
      if (data) setProfiles(data as Profile[])
    } catch (err) {
      console.error('Error fetching profiles:', err)
    }
  }

  const fetchAppointments = async () => {
    if (!user) return
    try {
      let query = supabase.from('appointments').select('*, profiles:requester_id(email, role)').order('requested_at', { ascending: false })
      if (!isStaff) {
        query = query.eq('requester_id', user.id)
      }
      const { data, error } = await query
      if (error) throw error
      setAppointments((data as Appointment[]) || [])
    } catch (err) {
      console.error('Error fetching appointments:', err)
    }
  }

  useEffect(() => {
    fetchProfiles()
    fetchAppointments()
  }, [user, profile])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('clinic-appointments-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, profile])

  const handleUpdateStatus = async () => {
    if (!editingApp) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: statusInput,
          admin_notes: notesInput.trim(),
        })
        .eq('id', editingApp.id)

      if (error) throw error
      setEditingApp(null)
      fetchAppointments()
    } catch (err: any) {
      setAlertText({ title: 'เกิดข้อผิดพลาด', desc: err.message })
      setAlertOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!appToCancel) return
    setCancelLoading(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appToCancel.id)

      if (error) throw error
      setCancelConfirmOpen(false)
      setAppToCancel(null)
      fetchAppointments()
    } catch (err: any) {
      setAlertText({ title: 'เกิดข้อผิดพลาด', desc: err.message })
      setAlertOpen(true)
    } finally {
      setCancelLoading(false)
    }
  }

  // Stat counts
  const pendingCount = appointments.filter((a) => a.status === 'pending').length
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length
  const completedCount = appointments.filter((a) => a.status === 'completed').length

  const filteredAppointments = appointments.filter((app) => {
    const requester = profiles.find((p) => p.id === app.requester_id)
    const email = app.profiles?.email || requester?.email || ''
    const matchesSearch =
      !search.trim() ||
      app.topic.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      (app.notes || '').toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false
    if (activeTab === 'pending') return app.status === 'pending'
    if (activeTab === 'confirmed') return app.status === 'confirmed'
    if (activeTab === 'cancelled') return app.status === 'cancelled'
    if (activeTab === 'completed') return app.status === 'completed'
    return true
  })

  const columns: DataTableColumn<Appointment>[] = [
    {
      key: 'requester',
      header: 'ผู้นัดหมาย',
      render: (app) => {
        const requester = profiles.find((p) => p.id === app.requester_id)
        const email = app.profiles?.email || requester?.email || 'ไม่ระบุผู้ใช้'
        const isSelf = app.requester_id === user?.id
        return (
          <div>
            <div className="font-bold text-xs text-[#0F172A]">{isSelf ? 'ฉัน' : email}</div>
            <div className="text-[10px] text-[#64748B] font-semibold mt-0.5">
              {email}
            </div>
          </div>
        )
      },
    },
    {
      key: 'topic',
      header: 'หัวข้อ / วันเวลาขอนัด',
      render: (app) => (
        <div>
          <div className="font-extrabold text-xs text-[#0F172A] max-w-sm truncate" title={app.topic}>
            {app.topic}
          </div>
          <div className="text-[10px] font-bold text-[#00796B] mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(app.requested_at).toLocaleString('th-TH')}
          </div>
          {app.notes && (
            <p className="text-[10px] text-[#64748B] font-semibold mt-1 max-w-xs truncate" title={app.notes}>
              รายละเอียด: {app.notes}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      align: 'center',
      render: (app) => (
        <div className="flex flex-col items-center gap-1">
          <StatusBadge status={app.status} size="sm" />
          {app.admin_notes && (
            <span className="text-[9px] text-[#64748B] italic max-w-[150px] truncate" title={app.admin_notes}>
              โน้ต: {app.admin_notes}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'วันที่ยื่นจอง',
      render: (app) => (
        <span className="text-[11px] font-mono font-bold text-[#64748B] whitespace-nowrap">
          {new Date(app.created_at).toLocaleDateString('th-TH')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (app) => {
        const isRequester = app.requester_id === user?.id
        return (
          <div className="flex items-center justify-end gap-2">
            {isStaff ? (
              <button
                onClick={() => {
                  setEditingApp(app)
                  setStatusInput(app.status)
                  setNotesInput(app.admin_notes || '')
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#E8F6F5] text-[#00796B] border border-[#BCE5E2] hover:bg-[#00796B] hover:text-white transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                จัดการคิว
              </button>
            ) : isRequester && app.status === 'pending' ? (
              <button
                onClick={() => {
                  setAppToCancel(app)
                  setCancelConfirmOpen(true)
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] hover:bg-[#9F1239] hover:text-white transition cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                ยกเลิกนัด
              </button>
            ) : (
              <span className="text-xs text-[#94A3B8]">—</span>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex-1 space-y-6 animate-fadeIn">
      <PageHeader
        title="รวมคำขอจองนัดหมาย"
        subtitle="Research Clinic — ติดตามสถานะและจัดการคำขอจองนัดหมายรับคำปรึกษา"
        extraBadge="Research Clinic Queue"
        action={
          <Link href="/clinic" className="shrink-0 btn-primary text-xs flex items-center gap-2 !py-2.5 !px-5">
            <CalendarPlus className="w-4 h-4 stroke-[2.5]" />
            จองนัดหมายปรึกษาใหม่
          </Link>
        }
      />

      {/* UNIFIED DATA TABLE WITH CARDS, TABS, SEARCH & TABLE */}
      <DataTable<Appointment>
        summaryCards={[
          {
            key: 'pending',
            count: pendingCount,
            label: 'รอการยืนยัน',
            icon: <Clock className="w-5 h-5" />,
            iconBg: 'bg-[#FFF8E7]',
            iconColor: 'text-[#D97706]',
          },
          {
            key: 'confirmed',
            count: confirmedCount,
            label: 'ยืนยันแล้ว',
            icon: <CheckCircle2 className="w-5 h-5" />,
            iconBg: 'bg-[#E8F6F5]',
            iconColor: 'text-[#00796B]',
          },
          {
            key: 'cancelled',
            count: cancelledCount,
            label: 'ยกเลิก',
            icon: <XCircle className="w-5 h-5" />,
            iconBg: 'bg-[#FFE4E6]',
            iconColor: 'text-[#E11D48]',
          },
          {
            key: 'completed',
            count: completedCount,
            label: 'เสร็จสิ้น',
            icon: <CheckCircle className="w-5 h-5" />,
            iconBg: 'bg-[#F1F5F9]',
            iconColor: 'text-[#475569]',
          },
        ]}
        tabs={[
          { id: 'all', label: 'ทั้งหมด', count: appointments.length },
          { id: 'pending', label: 'รอการยืนยัน', count: pendingCount },
          { id: 'confirmed', label: 'ยืนยันแล้ว', count: confirmedCount },
          { id: 'cancelled', label: 'ยกเลิก', count: cancelledCount },
          { id: 'completed', label: 'เสร็จสิ้น', count: completedCount },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as any)}
        eyebrow={isStaff ? 'การจัดการคิวนัดหมาย' : 'คำขอจองนัดหมายของฉัน'}
        title={isStaff ? 'รายการคำขอจองนัดหมายทั้งหมดในระบบ' : 'ติดตามสถานะการจองนัดหมายรับคำปรึกษา'}
        searchPlaceholder="ค้นหาหัวข้อ / อีเมล..."
        searchValue={search}
        onSearchChange={setSearch}
        columns={columns}
        data={filteredAppointments}
        getRowKey={(app) => app.id}
        empty={{
          icon: <Calendar className="w-10 h-10 stroke-[1.5]" />,
          title: 'ยังไม่มีคำขอจองนัดหมายในรายการนี้',
          body: 'เมื่อมีคำขอจองคิวรับคำปรึกษา รายการจะปรากฏที่นี่',
          dashed: true,
        }}
      />

      {/* MANAGING APPOINTMENT SIDEPANEL (FOR ADMIN / EXPERT) */}
      <SidePanel
        open={!!editingApp}
        onClose={() => setEditingApp(null)}
        title={editingApp?.topic || 'จัดการคิวนัดหมาย'}
        subtitle={profiles.find((p) => p.id === editingApp?.requester_id)?.email}
        footer={
          <>
            <button
              onClick={() => setEditingApp(null)}
              className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={isSubmitting}
              className="h-9 px-5 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-md disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00796B 0%, #005F56 100%)' }}
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </>
        }
      >
        {editingApp && (
          <div className="space-y-4">
            <div>
              <FieldLabel>หัวข้อที่ขอปรึกษา</FieldLabel>
              <p className="text-xs font-extrabold text-[#0F172A] p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                {editingApp.topic}
              </p>
              {editingApp.notes && (
                <p className="text-xs mt-2 text-[#475569] p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  {editingApp.notes}
                </p>
              )}
            </div>

            <div>
              <FieldLabel>วันเวลาขอนัดหมาย</FieldLabel>
              <p className="text-xs font-extrabold text-[#00796B]">
                🗓️ {new Date(editingApp.requested_at).toLocaleString('th-TH')}
              </p>
            </div>

            <div>
              <FieldLabel>สถานะคำขอ</FieldLabel>
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              >
                <option value="pending">รอการยืนยัน (Pending)</option>
                <option value="confirmed">ยืนยันแล้ว (Confirmed)</option>
                <option value="cancelled">ยกเลิกนัด (Cancelled)</option>
                <option value="completed">เสร็จสิ้น (Completed)</option>
              </select>
            </div>

            <div>
              <FieldLabel>โน้ตตอบกลับถึงผู้จองนัด</FieldLabel>
              <Textarea
                rows={4}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="ระบุสถานที่นัดพบ ลิงก์ออนไลน์ หรือคำแนะนำเบื้องต้น..."
                className="w-full light-input text-xs resize-none"
              />
            </div>
          </div>
        )}
      </SidePanel>

      {/* CONFIRM CANCEL DIALOG FOR REQUESTER */}
      <ConfirmDialog
        isOpen={cancelConfirmOpen}
        onClose={() => {
          setCancelConfirmOpen(false)
          setAppToCancel(null)
        }}
        onConfirm={handleConfirmCancel}
        title="ยกเลิกการนัดหมาย?"
        description="คุณต้องการยกเลิกคำขอจองนัดหมายปรึกษานี้หรือไม่?"
        confirmLabel="ยืนยันยกเลิกนัด"
        variant="danger"
        loading={cancelLoading}
      />

      {/* ALERT DIALOG */}
      <ConfirmDialog
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={() => {}}
        title={alertText.title}
        description={alertText.desc}
        confirmLabel="ตกลง"
        alertOnly
        variant="danger"
      />
    </div>
  )
}
