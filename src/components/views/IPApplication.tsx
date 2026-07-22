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
  Trash2,
  Shield,
  BookMarked,
  Cpu,
  Tag,
  ArrowRight,
  Download,
  Sparkles,
  FileCheck
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

export const IPApplication: React.FC = () => {
  const { user } = useAuth()
  const [forms, setForms] = useState<DownloadableForm[]>([])
  const [applications, setApplications] = useState<IPApp[]>([])

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [appIdToDelete, setAppIdToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const ipCategoryCards = [
    { title: 'สิทธิบัตร (Patents)', desc: 'การประดิษฐ์/กรรมวิธีใหม่ที่มีขั้นการประดิษฐ์สูงขึ้น', icon: Cpu, color: '#2BA8A2' },
    { title: 'อนุสิทธิบัตร (Petty Patents)', desc: 'การประดิษฐ์ใหม่ที่มีประโยชน์ในการปรับปรุงเทคโนโลยี', icon: Shield, color: '#FFD23F' },
    { title: 'ลิขสิทธิ์ (Copyrights)', desc: 'งานวรรณกรรม ซอฟต์แวร์ งานเขียน และผลงานสร้างสรรค์', icon: BookMarked, color: '#7D52E5' },
    { title: 'เครื่องหมายการค้า (Trademarks)', desc: 'ตราสินค้า สัญลักษณ์ และเครื่องหมายบริการ', icon: Tag, color: '#EF6C4A' },
  ]

  return (
    <div className="flex-1 space-y-6 animate-fadeIn">
      <PageHeader
        title="ทรัพย์สินทางปัญญา"
        subtitle="Intellectual Property — ยื่นขอขึ้นทะเบียน ติดตาม และจัดการสิทธิ์ผลงาน"
        extraBadge="IP Registration System"
        recordCode="IPA-03"
      />

      {/* HERO SECTION: INTELLECTUAL PROPERTY CATEGORIES */}
      <ContentPanel>
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-flip-card space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6F5] border border-[#BCE5E2] text-[#00796B] text-xs font-mono font-extrabold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INTELLECTUAL PROPERTY VAULT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                ประเภทการคุ้มครองทรัพย์สินทางปัญญา
              </h2>
            </div>
            <div className="flex items-center gap-3 bg-[#F8FAFC] px-4 py-2.5 rounded-full border border-[#E2E8F0]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse"></div>
              <span className="text-xs font-mono font-bold text-[#64748B]">คำขอทั้งหมดในระบบ: <strong className="text-[#0F172A] font-black">{applications.length}</strong> รายการ</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ipCategoryCards.map((cat, i) => {
              const IconComp = cat.icon
              return (
                <div key={i} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 hover:border-[#0F172A] transition group shadow-xs">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-[#E2E8F0] shadow-xs" style={{ color: cat.color }}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-xs text-[#0F172A] group-hover:text-[#00796B] transition-colors">{cat.title}</h4>
                  <p className="text-[10px] text-[#64748B] leading-relaxed font-semibold">{cat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </ContentPanel>

      {/* SECTION 1: GUIDANCE & LIFECYCLE STEPS */}
      <ContentPanel>
        <SectionHeader eyebrow="ขั้นตอนการดำเนินงาน" title="คู่มือและขั้นตอนการยื่นขอขึ้นทะเบียน IP" />
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { num: '01', title: 'เลือกประเภท & โหลดแบบฟอร์ม', detail: 'เลือกประเภทสิทธิ์ที่ต้องการยื่นและดาวน์โหลดแบบฟอร์มทางการ' },
              { num: '02', title: 'จัดเตรียมเอกสาร & หลักฐาน', detail: 'แนบคำพรรณนาการประดิษฐ์ ภาพถ่าย หรือซอร์สโค้ดให้ครบถ้วน' },
              { num: '03', title: 'ยื่นเอกสารที่งานวิจัยสถาบัน', detail: 'ส่งมอบเล่มเอกสารฉบับจริงให้เจ้าหน้าที่งานวิจัยและนวัตกรรม' },
              { num: '04', title: 'รับเลขคำขอ & โอนเข้าคลัง', detail: 'เจ้าหน้าที่บันทึกเข้าระบบ ออกเลขคำขอ และโอนเข้าคลังผลงาน' },
            ].map((step, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-[#0F172A] transition shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-[#00796B]">{step.num}</span>
                  <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F172A] transition-colors" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-[#0F172A] leading-snug">{step.title}</h5>
                  <p className="text-[10px] text-[#64748B] mt-1 leading-relaxed font-semibold">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ContentPanel>

      {/* SECTION 2: OFFICIAL FORMS GRID */}
      <ContentPanel>
        <SectionHeader eyebrow="แบบฟอร์มทางการ DIP" title="ดาวน์โหลดแบบฟอร์มยื่นขอขึ้นทะเบียนทรัพย์สินทางปัญญา" />
        <div className="mt-4">
          {forms.length === 0 ? (
            <EmptyState icon={<Clipboard className="w-10 h-10 stroke-[1.5]" />} title="ยังไม่มีแบบฟอร์มอัปโหลด" body="ติดต่องานวิจัยสถาบันเพื่อรับแบบฟอร์มทางอีเมล" dashed />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0F172A] transition duration-200 shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white border border-[#E2E8F0] text-[#00796B] shadow-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs truncate text-[#0F172A] group-hover:text-[#00796B] transition-colors" title={form.title}>{form.title}</p>
                      <p className="text-[10px] font-mono font-bold text-[#64748B] mt-0.5">แบบฟอร์มอย่างเป็นทางการ (DIP)</p>
                    </div>
                  </div>
                  <a
                    href={form.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 shrink-0 btn-gold text-xs flex items-center gap-1.5 !py-1.5 !px-3"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    ดาวน์โหลด
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </ContentPanel>

      {/* SECTION 3: MY APPLICATIONS TRACKER */}
      <ContentPanel>
        <div className="flex items-start justify-between gap-3">
          <SectionHeader eyebrow="รายการคำขอของฉัน" title="ติดตามสถานะและขั้นตอนพิจารณาคำขอ IP" />
        </div>
        <div className="mt-4">
          {!user ? (
            <EmptyState icon={<Clock className="w-12 h-12 stroke-[1.5]" />} title="เข้าสู่ระบบเพื่อติดตามสถานะ" body="จำเป็นต้องลงชื่อเข้าใช้ก่อนดูประวัติคำขอขึ้นทะเบียน" dashed />
          ) : applications.length === 0 ? (
            <EmptyState icon={<Award className="w-10 h-10 stroke-[1.5]" />} title="ยังไม่มีประวัติการยื่นคำขอ" body="คุณยังไม่ได้ส่งคำขอขึ้นทะเบียนทรัพย์สินทางปัญญากับงานวิจัยสถาบัน" />
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-6 rounded-2xl space-y-5 bg-white border border-[#E2E8F0] shadow-flip-card hover:border-[#0F172A] transition"
                >
                  {/* Header row */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-[#0F172A]">{app.title}</h4>
                      <div className="flex flex-wrap gap-2 items-center">
                        <StatusBadge status={app.ip_type} size="sm" />
                        <span className="text-xs font-mono font-bold text-[#64748B]">
                          ยื่นเมื่อ {new Date(app.created_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <StatusBadge status={app.status} size="sm" />
                      {app.request_number && (
                        <div className="text-[10px] font-mono font-bold text-[#64748B]">
                          เลขคำขอ: <span className="text-[#0F172A] font-black">{app.request_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="rounded-2xl p-4 bg-[#F8FAFC] border border-[#E2E8F0]">
                    <p className="text-[9px] font-mono font-black uppercase tracking-[0.15em] mb-2 text-[#00796B]">
                      ความคืบหน้าการพิจารณา
                    </p>
                    <TimelineSteps status={app.status} />
                  </div>

                  {/* Notes */}
                  {(app.current_step || app.admin_notes || app.transferred_to_catalog) && (
                    <div className="rounded-2xl p-4 space-y-2 text-xs font-semibold bg-[#FFF8E7] border border-[#F3E5C8] text-[#1E8C86]">
                      {app.current_step && (
                        <div><span className="font-extrabold">ขั้นตอนปัจจุบัน:</span> {app.current_step}</div>
                      )}
                      {app.admin_notes && (
                        <div><span className="font-extrabold">บันทึกจากเจ้าหน้าที่:</span> {app.admin_notes}</div>
                      )}
                      {app.transferred_to_catalog && (
                        <div className="text-[#27AE60] font-black flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4" /> ได้รับการขึ้นทะเบียนและโอนเข้าสู่คลังผลงานวิจัยหลักแล้ว
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleDeleteApplication(app.id)}
                      className="btn-coral text-xs flex items-center gap-1.5 !py-1.5 !px-3"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ลบคำขอ
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
