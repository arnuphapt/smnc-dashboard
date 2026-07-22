'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

const supabase = createClient()
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Award,
  Clipboard,
  Trash2
} from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { PageHeader, ContentPanel, SectionHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface DownloadableForm {
  id: string
  title: string
  file_url: string
  category: string
}

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


const TimelineSteps: React.FC<{ status: string }> = ({ status }) => {
  const steps = ['ยื่นคำขอ', 'กำลังตรวจสอบ', 'รอเอกสารเพิ่ม', 'อนุมัติ']
  const activeIndex = status === 'อนุมัติ' ? 3 : status === 'ไม่อนุมัติ' ? 3 : status === 'รอเอกสารเพิ่ม' ? 2 : status === 'กำลังตรวจสอบ' ? 1 : 0

  return (
    <div className="flex items-center w-full mt-2">
      {steps.map((step, idx) => {
        const done = idx < activeIndex
        const active = idx === activeIndex
        const denied = active && status === 'ไม่อนุมัติ'
        const warning = active && status === 'รอเอกสารเพิ่ม'

        const dotBg = done ? '#0EA5A0' : active ? (denied ? '#9F1239' : warning ? '#B45309' : '#0B1D3A') : '#E2EDF8'
        const dotColor = done || active ? '#FFFFFF' : '#94A3B8'
        const lineColor = done ? '#0EA5A0' : '#E2EDF8'
        const labelColor = active ? '#0B1D3A' : done ? '#475569' : '#94A3B8'
        const labelWeight = active ? '800' : done ? '600' : '500'

        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center" style={{ minWidth: 0, flex: '0 0 auto' }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: dotBg, color: dotColor }}
              >
                {done ? <CheckCircle className="w-4 h-4" /> : denied ? <XCircle className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className="text-[9px] mt-1.5 text-center leading-tight"
                style={{ color: labelColor, fontWeight: labelWeight, maxWidth: '52px' }}
              >
                {idx === 3 && status === 'ไม่อนุมัติ' ? 'ไม่อนุมัติ' : step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="h-0.5 flex-1 mx-1 -mt-5 rounded-full" style={{ background: lineColor }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export const IPApplication: React.FC = () => {
  const { user } = useAuth()
  const [forms, setForms] = useState<DownloadableForm[]>([])
  const [applications, setApplications] = useState<IPApp[]>([])

  // Delete confirm modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [appIdToDelete, setAppIdToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Custom Alert Dialog States
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{ title: string; description: string; variant?: 'primary' | 'danger' | 'warning' } | null>(null)

  const triggerAlert = (title: string, description: string, variant: 'primary' | 'danger' | 'warning' = 'primary') => {
    setAlertConfig({ title, description, variant })
    setAlertDialogOpen(true)
  }

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase.from('downloadable_forms').select('*').eq('category', 'ip').order('sort_order', { ascending: true })
      if (error) throw error
      setForms(data || [])
    } catch (err) { console.error(err) }
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

  useEffect(() => { fetchForms(); fetchApplications() }, [user])

  useEffect(() => {
    if (!user) return
    const s = supabase.channel('ip-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ip_applications' }, () => fetchApplications()).subscribe()
    return () => { supabase.removeChannel(s) }
  }, [user])

  return (
    <div className="flex-1 space-y-6 animate-fadeIn">
      <PageHeader
        title="ทรัพย์สินทางปัญญา"
        subtitle="Intellectual Property — ยื่นขอขึ้นทะเบียน ติดตาม และจัดการสิทธิ์ผลงาน"
        extraBadge="IP Registration System"
        recordCode="IPA-03"
      />

      {/* SECTION: GUIDE */}
      <ContentPanel>
        <SectionHeader eyebrow="ขั้นตอนและแบบฟอร์ม" title="คู่มือการยื่นขอขึ้นทะเบียนทรัพย์สินทางปัญญา" />
        <div className="space-y-6 mt-4">
          {/* Steps guide */}
          <div className="p-6 rounded-2xl space-y-4" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}>
            {[
              { step: 'เลือกประเภทและดาวน์โหลดแบบฟอร์ม', detail: 'สิทธิบัตร อนุสิทธิบัตร ลิขสิทธิ์ หรือเครื่องหมายการค้า' },
              { step: 'จัดเตรียมเอกสารและหลักฐาน', detail: 'รูปภาพ รายละเอียดการประดิษฐ์ หรือซอร์สโค้ด (กรณีโปรแกรม)' },
              { step: 'ส่งเอกสารที่งานวิจัยสถาบัน', detail: 'นำเอกสารที่เตรียมไว้ส่งให้เจ้าหน้าที่งานวิจัยและนวัตกรรมเพื่อบันทึกเข้าระบบ' },
              { step: 'ติดตามสถานะและรับผล', detail: 'แอดมินจะแจ้งผลผ่านหัวข้อติดตามสถานะและอัปเดตขั้นตอน' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-4">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5"
                  style={{ background: '#0B1D3A', color: '#0EA5A0' }}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0B1D3A' }}>{s.step}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ContentPanel>

      {/* SECTION: FORMS */}
      <ContentPanel>
        <SectionHeader eyebrow="แบบฟอร์มทางการ" title="รายการแบบฟอร์มยื่นขอขึ้นทะเบียนทรัพย์สินทางปัญญา" />
        <div className="mt-4">
          {forms.length === 0 ? (
            <EmptyState icon={<Clipboard className="w-10 h-10 stroke-[1.5]" />} title="ยังไม่มีแบบฟอร์มอัปโหลด" body="ติดต่องานวิจัยสถาบันเพื่อรับแบบฟอร์มทางอีเมล" dashed />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#0B1D3A' }}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate" style={{ color: '#0B1D3A' }} title={form.title}>{form.title}</p>
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#94A3B8' }}>แบบฟอร์มอย่างเป็นทางการ</p>
                    </div>
                  </div>
                  <a
                    href={form.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: '#FFFFFF', color: '#0B1D3A', border: '1px solid #DAEEFF' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> ดาวน์โหลด
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </ContentPanel>

      {/* SECTION: STATUS */}
      <ContentPanel>
        <div className="flex items-start justify-between gap-3">
          <SectionHeader eyebrow="ของฉัน" title="ติดตามสถานะคำขอ" />
        </div>
        <div className="mt-4">
          {!user ? (
            <EmptyState icon={<Clock className="w-12 h-12 stroke-[1.5]" />} title="เข้าสู่ระบบเพื่อติดตามสถานะ" body="จำเป็นต้องลงชื่อเข้าใช้ก่อนดูประวัติคำขอ" dashed />
          ) : applications.length === 0 ? (
            <EmptyState icon={<Award className="w-10 h-10 stroke-[1.5]" />} title="ยังไม่มีประวัติการยื่นคำขอ" />
          ) : (
            <div className="space-y-5">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-6 rounded-2xl space-y-5 transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}
                >
                  {/* Header row */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-black text-sm" style={{ color: '#0B1D3A' }}>{app.title}</h4>
                      <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                        <StatusBadge status={app.ip_type} size="sm" />
                        <span className="text-xs font-semibold text-slate-400">
                          ยื่นเมื่อ {new Date(app.created_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={app.status} size="sm" />
                      {app.request_number && (
                        <div className="text-[10px] font-bold mt-1.5" style={{ color: '#64748B' }}>
                          เลขคำขอ: <span className="font-mono">{app.request_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #DAEEFF' }}>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] mb-3" style={{ color: '#0EA5A0' }}>
                      ความคืบหน้าการพิจารณา
                    </p>
                    <TimelineSteps status={app.status} />
                  </div>

                  {/* Notes */}
                  {(app.current_step || app.admin_notes || app.transferred_to_catalog) && (
                    <div className="rounded-xl p-4 space-y-2 text-xs font-medium" style={{ background: '#FFFFFF', border: '1px solid #DAEEFF', color: '#475569' }}>
                      {app.current_step && (
                        <div><span className="font-bold" style={{ color: '#0B1D3A' }}>สถานะปัจจุบัน:</span> {app.current_step}</div>
                      )}
                      {app.admin_notes && (
                        <div><span className="font-bold" style={{ color: '#0B1D3A' }}>บันทึกจากเจ้าหน้าที่:</span> {app.admin_notes}</div>
                      )}
                      {app.transferred_to_catalog && (
                        <div className="text-emerald-700 font-bold">✓ ได้รับการขึ้นทะเบียนและโอนเข้าสู่คลังผลงานวิจัยหลักแล้ว</div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleDeleteApplication(app.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
                      style={{ background: '#FFF1F2', color: '#9F1239', borderColor: '#FECDD3' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      ลบคำขอ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ContentPanel>

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
