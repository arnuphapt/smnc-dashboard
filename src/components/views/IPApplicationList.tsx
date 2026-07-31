'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

const supabase = createClient()
import {
  Clock,
  FileEdit,
  RotateCcw,
  FileCheck,
  Trash2,
  Eye,
  Award,
  UploadCloud,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { PageHeader, ContentPanel, SectionHeader } from '@/components/PageHeader'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface IPApp {
  id: string
  title: string
  ip_type: string
  request_number?: string
  status: string
  current_step?: string
  admin_notes?: string
  transferred_to_catalog: boolean
  created_at: string
}

const PENDING_STATUSES = ['ยื่นคำขอ', 'กำลังตรวจสอบ', 'รอเอกสารเพิ่ม']
const APPROVED_STATUSES = ['อนุมัติ', 'ไม่อนุมัติ']

// Flip7 Style Monospace Timeline Bar
const TimelineSteps: React.FC<{ status: string }> = ({ status }) => {
  const steps = ['ยื่นคำขอ', 'กำลังตรวจสอบ', 'รอเอกสารเพิ่ม', 'อนุมัติ']
  const activeIndex = status === 'อนุมัติ' ? 3 : status === 'ไม่อนุมัติ' ? 3 : status === 'รอเอกสารเพิ่ม' ? 2 : status === 'กำลังตรวจสอบ' ? 1 : 0

  return (
    <div className="flex items-center w-full mt-3">
      {steps.map((step, idx) => {
        const done = idx < activeIndex
        const active = idx === activeIndex
        const denied = active && status === 'ไม่อนุมัติ'
        const warning = active && status === 'รอเอกสารเพิ่ม'

        const dotBg = done ? '#27AE60' : active ? (denied ? '#EF6C4A' : warning ? '#FFD23F' : '#2BA8A2') : '#E2F1F0'
        const dotColor = done || active ? '#FFFFFF' : '#6BAAA6'
        const lineColor = done ? '#27AE60' : '#E2F1F0'
        const labelColor = active ? '#1E8C86' : done ? '#27AE60' : '#6BAAA6'

        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-black transition-all shadow-md"
                style={{ background: dotBg, color: dotColor }}
              >
                {done ? <CheckCircle className="w-4 h-4 stroke-[2.5]" /> : denied ? <XCircle className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
              </div>
              <span
                className="text-[10px] mt-1.5 text-center leading-tight font-sans"
                style={{ color: labelColor, fontWeight: active ? '800' : '600', maxWidth: '64px' }}
              >
                {idx === 3 && status === 'ไม่อนุมัติ' ? 'ไม่อนุมัติ' : step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="h-1 flex-1 mx-1.5 -mt-5 rounded-full transition-colors" style={{ background: lineColor }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export const IPApplicationList: React.FC = () => {
  const { user } = useAuth()
  const [applications, setApplications] = useState<IPApp[]>([])
  const [activeQueueTab, setActiveQueueTab] = useState<'all' | 'submitted' | 'reviewing' | 'revision' | 'approved'>('all')

  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [selectedAppForProgress, setSelectedAppForProgress] = useState<IPApp | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [appIdToDelete, setAppIdToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{ title: string; description: string; variant?: 'primary' | 'danger' | 'warning' } | null>(null)

  const triggerAlert = (title: string, description: string, variant: 'primary' | 'danger' | 'warning' = 'primary') => {
    setAlertConfig({ title, description, variant })
    setAlertDialogOpen(true)
  }

  const fetchApplications = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('ip_applications').select('*').eq('applicant_id', user.id).order('created_at', { ascending: false })
      if (error) throw error
      setApplications(data || [])
    } catch (err) { console.error(err) }
  }

  const handleDeleteApplication = (appId: string) => {
    setAppIdToDelete(appId)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!appIdToDelete) return
    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('ip_applications')
        .delete()
        .eq('id', appIdToDelete)
      if (error) throw error

      setDeleteConfirmOpen(false)
      setAppIdToDelete(null)
      fetchApplications()
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถลบคำขอได้: ${err.message}`, 'danger')
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => { fetchApplications() }, [user])

  useEffect(() => {
    if (!user) return
    const s = supabase.channel('ip-list-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ip_applications' }, () => fetchApplications()).subscribe()
    return () => { supabase.removeChannel(s) }
  }, [user])

  const waitingCount = applications.filter(a => a.status === 'ยื่นคำขอ').length
  const reviewingCount = applications.filter(a => a.status === 'กำลังตรวจสอบ').length
  const revisionCount = applications.filter(a => a.status === 'รอเอกสารเพิ่ม').length
  const approvedCount = applications.filter(a => a.status === 'อนุมัติ').length

  const visibleApplications = applications.filter((app) => {
    if (activeQueueTab === 'submitted') return app.status === 'ยื่นคำขอ'
    if (activeQueueTab === 'reviewing') return app.status === 'กำลังตรวจสอบ'
    if (activeQueueTab === 'revision') return app.status === 'รอเอกสารเพิ่ม'
    if (activeQueueTab === 'approved') return app.status === 'อนุมัติ' || app.status === 'ไม่อนุมัติ'
    return true
  })

  const columns: DataTableColumn<IPApp>[] = [
    {
      key: 'title',
      header: 'ชื่อผลงาน',
      render: (app) => (
        <>
          <div className="text-xs font-extrabold text-[#0F172A]">{app.title}</div>
          <div className="mt-1"><StatusBadge status={app.ip_type} size="sm" /></div>
        </>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (app) => (
        <>
          <StatusBadge status={app.status} size="sm" />
          {app.request_number && (
            <div className="text-[10px] font-mono font-bold text-[#64748B] mt-1">
              เลขคำขอ: <span className="text-[#0F172A] font-black">{app.request_number}</span>
            </div>
          )}
        </>
      ),
    },
    {
      key: 'progress',
      header: 'ความคืบหน้า',
      align: 'center',
      render: (app) => (
        <button
          onClick={() => { setSelectedAppForProgress(app); setProgressModalOpen(true) }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold text-[#00796B] bg-[#F0F7FF] border border-[#DAEEFF] hover:bg-[#E0F2FE] transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          title="ดูความคืบหน้า"
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          ดูความคืบหน้า
        </button>
      ),
    },
    {
      key: 'created_at',
      header: 'วันที่ยื่น',
      render: (app) => <span className="whitespace-nowrap">{new Date(app.created_at).toLocaleDateString('th-TH')}</span>,
    },
    {
      key: 'จัดการ',
      header: 'จัดการ',
      align: 'center',
      render: (app) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handleDeleteApplication(app.id)}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold !py-1.5 !px-3 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#DC2626] hover:text-white transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ลบคำขอ
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex-1 space-y-6 animate-fadeIn">
      <PageHeader
        title="รวมคำขอขึ้นทะเบียน IP"
        subtitle="Intellectual Property — ติดตามสถานะและขั้นตอนพิจารณาคำขอทรัพย์สินทางปัญญา"
        extraBadge="IP Registration System"
        action={
          <Link
            href="/ip-application"
            className="shrink-0 btn-primary text-xs flex items-center gap-2 !py-2.5 !px-5"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            ยื่นขอขึ้นทะเบียนใหม่
          </Link>
        }
      />

      {/* UNIFIED DATA TABLE WITH CARDS, TABS & TABLE */}
      <DataTable<IPApp>
        summaryCards={[
          {
            key: 'waiting',
            count: waitingCount,
            label: 'ยื่นคำขอ / รอตรวจ',
            icon: <Clock className="w-5 h-5" />,
            iconBg: 'bg-[#E0F2FE]',
            iconColor: 'text-[#0284C7]',
          },
          {
            key: 'reviewing',
            count: reviewingCount,
            label: 'กำลังตรวจสอบ',
            icon: <FileEdit className="w-5 h-5" />,
            iconBg: 'bg-[#F3E8FF]',
            iconColor: 'text-[#7C3AED]',
          },
          {
            key: 'revision',
            count: revisionCount,
            label: 'รอเอกสารเพิ่ม',
            icon: <RotateCcw className="w-5 h-5" />,
            iconBg: 'bg-[#FFF8E7]',
            iconColor: 'text-[#D97706]',
          },
          {
            key: 'approved',
            count: approvedCount,
            label: 'อนุมัติแล้ว',
            icon: <FileCheck className="w-5 h-5" />,
            iconBg: 'bg-[#E8F6F5]',
            iconColor: 'text-[#00796B]',
          },
        ]}
        tabs={[
          { id: 'all', label: 'ทั้งหมด', count: applications.length },
          { id: 'submitted', label: 'ยื่นคำขอ / รอตรวจ', count: waitingCount },
          { id: 'reviewing', label: 'กำลังตรวจสอบ', count: reviewingCount },
          { id: 'revision', label: 'รอเอกสารเพิ่ม', count: revisionCount },
          { id: 'approved', label: 'อนุมัติแล้ว', count: approvedCount },
        ]}
        activeTab={activeQueueTab}
        onTabChange={(tabId) => setActiveQueueTab(tabId as any)}
        eyebrow="รายการคำขอของฉัน"
        title="ติดตามสถานะและขั้นตอนพิจารณาคำขอ IP"
        columns={columns}
        data={visibleApplications}
        getRowKey={(app) => app.id}
        empty={{
          icon: <Award className="w-10 h-10 stroke-[1.5]" />,
          title: 'ยังไม่มีรายการในหมวดนี้',
          body: 'เมื่อมีคำขอที่ตรงเงื่อนไข รายการจะปรากฏที่นี่',
          dashed: true,
        }}
      />

      {/* MODAL: VIEW PROGRESS TIMELINE */}
      <Dialog open={progressModalOpen} onOpenChange={setProgressModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#64748B]">ความคืบหน้าการพิจารณา</p>
            <DialogTitle className="header-display text-lg font-black text-[#0F172A]">
              {selectedAppForProgress?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4">
            {selectedAppForProgress && (
              <>
                <div className="rounded-2xl p-4 bg-[#F8FAFC] border border-[#E2E8F0]">
                  <p className="text-[9px] font-mono font-black uppercase tracking-[0.15em] mb-2 text-[#00796B]">
                    ความคืบหน้าการพิจารณา
                  </p>
                  <TimelineSteps status={selectedAppForProgress.status} />
                </div>

                {(selectedAppForProgress.current_step || selectedAppForProgress.admin_notes || selectedAppForProgress.transferred_to_catalog) && (
                  <div className="rounded-2xl p-4 space-y-2 text-xs font-semibold bg-[#FFF8E7] border border-[#F3E5C8] text-[#1E8C86]">
                    {selectedAppForProgress.current_step && (
                      <div><span className="font-extrabold">ขั้นตอนปัจจุบัน:</span> {selectedAppForProgress.current_step}</div>
                    )}
                    {selectedAppForProgress.admin_notes && (
                      <div><span className="font-extrabold">บันทึกจากเจ้าหน้าที่:</span> {selectedAppForProgress.admin_notes}</div>
                    )}
                    {selectedAppForProgress.transferred_to_catalog && (
                      <div className="text-[#27AE60] font-black flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4" /> ได้รับการขึ้นทะเบียนและโอนเข้าสู่คลังผลงานวิจัยหลักแล้ว
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setAppIdToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="ยืนยันการลบคำขอ?"
        description="คุณต้องการลบคำขอขึ้นทะเบียนทรัพย์สินทางปัญญานี้หรือไม่?"
        confirmLabel="ลบเอกสาร"
        variant="danger"
        loading={deleteLoading}
      />
      <ConfirmDialog
        isOpen={alertDialogOpen}
        onClose={() => {
          setAlertDialogOpen(false)
          setAlertConfig(null)
        }}
        onConfirm={() => {}}
        title={alertConfig?.title || ''}
        description={alertConfig?.description || ''}
        confirmLabel="ตกลง"
        alertOnly
        variant={alertConfig?.variant || 'primary'}
      />
    </div>
  )
}
