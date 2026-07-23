'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth, Profile } from '@/context/AuthContext'

const supabase = createClient()
import { useMasters } from '@/context/MasterContext'
import { hasRole, formatUserRolesText } from '@/utils/roleHelper'
import {
  FileText,
  UploadCloud,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Clipboard,
  Briefcase,
  UserCheck,
  Trash2,
  ShieldCheck,
  FileCheck,
  Download,
  Sparkles
} from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { PageHeader, ContentPanel, SectionHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  EVALUATION_CRITERIA,
  parseReviewerNotes,
  serializeReviewerNotes,
  handleExportEvaluation
} from './masterdata/EthicsTab'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface DownloadableForm {
  id: string
  title: string
  file_url: string
  category: string
}

interface EthicsSubmission {
  id: string
  project_title: string
  project_description?: string
  status: string
  assigned_reviewer_id?: string
  reviewer_notes?: string
  created_at: string
}

interface EthicsAttachment {
  id: string
  submission_id: string
  file_url: string
  file_name?: string
  file_type?: string
}

const inputBase = "w-full text-sm px-4 py-2.5 rounded-2xl focus:outline-none transition-all duration-200"
const inputSty = { border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A' }

export const Ethics: React.FC = () => {
  const { user, profile } = useAuth()
  const { getOptionsByCategory } = useMasters()

  const [forms, setForms] = useState<DownloadableForm[]>([])
  const [submissions, setSubmissions] = useState<EthicsSubmission[]>([])
  const [attachments, setAttachments] = useState<EthicsAttachment[]>([])
  const [reviewSubmissions, setReviewSubmissions] = useState<any[]>([])
  const [expertProfiles, setExpertProfiles] = useState<Profile[]>([])

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)

  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewStatus, setReviewStatus] = useState('กำลังตรวจ')
  const [reviewerRoleLabel, setReviewerRoleLabel] = useState('ผู้ทรงคุณวุฒิท่านที่ 1')

  const [revisionModalOpen, setRevisionModalOpen] = useState(false)
  const [selectedSubForRevision, setSelectedSubForRevision] = useState<any | null>(null)
  const [revisionFiles, setRevisionFiles] = useState<FileList | null>(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [revisionSubmitting, setRevisionSubmitting] = useState(false)
  const [revisionError, setRevisionError] = useState('')
  const [revisionSuccess, setRevisionSuccess] = useState('')

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [subIdToDelete, setSubIdToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{ title: string; description: string; variant?: 'primary' | 'danger' | 'warning' } | null>(null)

  const triggerAlert = (title: string, description: string, variant: 'primary' | 'danger' | 'warning' = 'primary') => {
    setAlertConfig({ title, description, variant })
    setAlertDialogOpen(true)
  }

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedSubForReview, setSelectedSubForReview] = useState<any | null>(null)
  const [scores, setScores] = useState<Record<string, 'pass' | 'fail' | 'na'>>({
    obj: 'pass',
    method: 'pass',
    privacy: 'pass',
    consent: 'pass',
    risk: 'pass',
    benefit: 'pass',
  })

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase.from('downloadable_forms').select('*').eq('category', 'ethics').order('sort_order', { ascending: true })
      if (error) throw error
      setForms(data || [])
    } catch (err) { console.error(err) }
  }

  const fetchSubmissions = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('ethics_submissions').select('*').eq('submitter_id', user.id).order('created_at', { ascending: false })
      if (error) throw error
      setSubmissions(data || [])
    } catch (err) { console.error(err) }
  }

  const fetchReviewSubmissions = async () => {
    if (!user) return
    try {
      let query = supabase.from('ethics_submissions').select('*, profiles:submitter_id(email)').order('created_at', { ascending: false })
      if (hasRole(profile?.role, 'expert') && !hasRole(profile?.role, 'admin')) {
        query = query.eq('assigned_reviewer_id', user.id)
      }
      const { data, error } = await query
      if (error) throw error
      setReviewSubmissions(data || [])
    } catch (err) { console.error(err) }
  }

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase.from('ethics_attachments').select('*')
      if (error) throw error
      setAttachments(data || [])
    } catch (err) { console.error(err) }
  }

  const fetchExpertProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      const experts = ((data as Profile[]) || []).filter((p) => hasRole(p.role, 'expert'))
      setExpertProfiles(experts)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchForms()
    fetchAttachments()
    fetchSubmissions()
    fetchReviewSubmissions()
    fetchExpertProfiles()
  }, [user, profile])

  useEffect(() => {
    if (!user) return
    const s = supabase.channel('ethics-sub-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_submissions' }, () => { fetchSubmissions(); fetchReviewSubmissions() }).subscribe()
    const a = supabase.channel('ethics-att-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_attachments' }, () => fetchAttachments()).subscribe()
    return () => { supabase.removeChannel(s); supabase.removeChannel(a) }
  }, [user, profile])

  const handleOpenSubmitModal = () => {
    setTitle('')
    setDesc('')
    setFiles(null)
    setFormError('')
    setFormSuccess('')
    setSubmitModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setFormError(''); setFormSuccess(''); setIsSubmitting(true)
    if (!title.trim()) { setFormError('กรุณากรอกชื่อโครงร่างวิจัย'); setIsSubmitting(false); return }
    try {
      const { data: subData, error: subError } = await supabase.from('ethics_submissions').insert({ submitter_id: user.id, project_title: title.trim(), project_description: desc.trim(), status: 'ยื่นแล้ว' }).select().single()
      if (subError) throw subError
      const submissionId = subData.id
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const extIndex = file.name.lastIndexOf('.')
          const ext = extIndex !== -1 ? file.name.substring(extIndex) : ''
          const base = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name
          const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, '_')
          const safeName = /[a-zA-Z0-9]/.test(sanitizedBase) ? sanitizedBase : 'doc'
          const storagePath = `ethics/${user.id}/${Date.now()}_${safeName}${ext}`

          const { error: uploadError } = await supabase.storage.from('wisdom-private').upload(storagePath, file)
          if (uploadError) throw uploadError
          const { error: attachError } = await supabase.from('ethics_attachments').insert({ submission_id: submissionId, file_url: storagePath, file_name: file.name, file_type: file.type })
          if (attachError) throw attachError
        }
      }
      setFormSuccess('ยื่นคำขอรับการพิจารณาจริยธรรมเรียบร้อยแล้ว!')
      setTitle(''); setDesc(''); setFiles(null)
      const fileInput = document.getElementById('ethics-files') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err: any) { setFormError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล') } finally { setIsSubmitting(false) }
  }

  const handleDownloadFile = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('wisdom-private').createSignedUrl(path, 60)
      if (error) throw error
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    } catch (err: any) { triggerAlert('ไม่สามารถเปิดไฟล์แนบได้', err.message, 'danger') }
  }

  const handleSaveReview = async (subId: string, status: string, notes: string) => {
    try {
      const { error } = await supabase.from('ethics_submissions').update({ status, reviewer_notes: notes }).eq('id', subId)
      if (error) throw error
      fetchReviewSubmissions()
      fetchSubmissions()
      triggerAlert('บันทึกสำเร็จ', 'บันทึกผลการพิจารณาเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) { triggerAlert('เกิดข้อผิดพลาด', err.message, 'danger') }
  }

  const handleDeleteSubmission = (subId: string) => {
    setSubIdToDelete(subId)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!subIdToDelete) return
    setDeleteLoading(true)
    try {
      const { error: attError } = await supabase
        .from('ethics_attachments')
        .delete()
        .eq('submission_id', subIdToDelete)
      if (attError) throw attError

      const { error: subError } = await supabase
        .from('ethics_submissions')
        .delete()
        .eq('id', subIdToDelete)
      if (subError) throw subError

      setDeleteConfirmOpen(false)
      setSubIdToDelete(null)
      fetchSubmissions()
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถลบคำขอได้: ${err.message}`, 'danger')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleExportClick = async (sub: any) => {
    let reviewerEmail = 'ผู้ทรงคุณวุฒิ'
    if (sub.assigned_reviewer_id) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', sub.assigned_reviewer_id)
          .single()
        if (data) reviewerEmail = data.email
      } catch (err) { console.error(err) }
    }
    const submitterEmail = sub.profiles?.email || user?.email || ''
    handleExportEvaluation(sub, reviewerEmail, submitterEmail)
  }

  const handleOpenRevisionModal = (sub: any) => {
    setSelectedSubForRevision(sub)
    setRevisionFiles(null)
    setRevisionNotes('')
    setRevisionError('')
    setRevisionSuccess('')
    setRevisionModalOpen(true)
  }

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedSubForRevision) return
    setRevisionError(''); setRevisionSuccess(''); setRevisionSubmitting(true)

    if (!revisionFiles || revisionFiles.length === 0) {
      setRevisionError('กรุณาอัปโหลดเอกสารปรับปรุงแก้ไข')
      setRevisionSubmitting(false)
      return
    }

    try {
      for (let i = 0; i < revisionFiles.length; i++) {
        const file = revisionFiles[i]
        const extIndex = file.name.lastIndexOf('.')
        const ext = extIndex !== -1 ? file.name.substring(extIndex) : ''
        const base = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name
        const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, '_')
        const safeName = /[a-zA-Z0-9]/.test(sanitizedBase) ? sanitizedBase : 'doc'
        const storagePath = `ethics/${user.id}/revised_${Date.now()}_${safeName}${ext}`

        const { error: uploadError } = await supabase.storage.from('wisdom-private').upload(storagePath, file)
        if (uploadError) throw uploadError
        const { error: attachError } = await supabase.from('ethics_attachments').insert({
          submission_id: selectedSubForRevision.id,
          file_url: storagePath,
          file_name: `[ฉบับแก้ไข] ${file.name}`,
          file_type: file.type
        })
        if (attachError) throw attachError
      }

      const timestamp = new Date().toLocaleString('th-TH')
      const appendedNote = `\n\n[ระบบ: ผู้ยื่นส่งเล่มปรับปรุงใหม่เมื่อ ${timestamp}]\nบันทึกแก้ไขของผู้ยื่น: ${revisionNotes.trim() || 'ไม่มีระบุ'}\n-----------------------------------\n`
      const newReviewerNotes = (selectedSubForRevision.reviewer_notes || '') + appendedNote

      const { error: updateError } = await supabase.from('ethics_submissions').update({
        status: 'ยื่นแล้ว',
        reviewer_notes: newReviewerNotes
      }).eq('id', selectedSubForRevision.id)

      if (updateError) throw updateError

      setRevisionSuccess('ยื่นเล่มเอกสารปรับปรุงเรียบร้อยแล้ว!')
      setTimeout(() => {
        setRevisionModalOpen(false)
        fetchSubmissions()
        fetchAttachments()
      }, 1500)
    } catch (err: any) {
      setRevisionError(err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล')
    } finally {
      setRevisionSubmitting(false)
    }
  }

  const isReviewTabVisible = hasRole(profile?.role, 'expert') || hasRole(profile?.role, 'admin')

  const pendingCount = submissions.filter(s => s.status === 'ยื่นแล้ว' || s.status === 'กำลังตรวจ').length
  const approvedCount = submissions.filter(s => s.status === 'อนุมัติ').length

  return (
    <div className="flex-1 space-y-6 animate-fadeIn">
      <PageHeader
        title="จริยธรรมการวิจัย"
        subtitle="Research Ethics — ยื่น ติดตาม และพิจารณาคำขอรับรองจริยธรรมการวิจัยในมนุษย์ (IRB)"
        extraBadge="Ethics Review Board"
      />

      {/* HERO SECTION: IRB MASTHEAD & STATS */}
      <ContentPanel>
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-flip-card space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6F5] border border-[#BCE5E2] text-[#00796B] text-xs font-mono font-extrabold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>HUMAN RESEARCH ETHICS BOARD (IRB)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                ศูนย์พิจารณาจริยธรรมการวิจัยในมนุษย์
              </h2>
            </div>
            {user && (
              <Button
                onClick={handleOpenSubmitModal}
                className="shrink-0 btn-primary text-xs flex items-center gap-2 !py-2.5 !px-5"
              >
                <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                ยื่นโครงร่างวิจัยขอรับการพิจารณา
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[#0F172A] border border-[#E2E8F0] font-bold shadow-xs">
                <Clipboard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">คำขอทั้งหมดของฉัน</span>
                <span className="text-xl font-mono font-black text-[#0F172A]">{submissions.length} รายการ</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[#0F172A] border border-[#E2E8F0] font-bold shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">อยู่ระหว่างพิจารณา</span>
                <span className="text-xl font-mono font-black text-[#0F172A]">{pendingCount} รายการ</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[#0F172A] border border-[#E2E8F0] font-bold shadow-xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">ผ่านการรับรองอนุมัติ</span>
                <span className="text-xl font-mono font-black text-[#0F172A]">{approvedCount} รายการ</span>
              </div>
            </div>
          </div>
        </div>
      </ContentPanel>

      {/* SECTION 1: FORMS GRID */}
      <ContentPanel>
        <SectionHeader eyebrow="แบบฟอร์มทางการ" title="ดาวน์โหลดแบบฟอร์มยื่นขอรับรองจริยธรรมการวิจัย" />
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
                      <p className="text-[10px] font-mono font-bold text-[#64748B] mt-0.5">แบบฟอร์ม IRB ทางการ</p>
                    </div>
                  </div>
                  <a
                    href={form.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 shrink-0 btn-primary text-xs flex items-center gap-1.5 !py-1.5 !px-3"
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

      {/* SECTION 2: MY SUBMISSIONS TABLE */}
      <ContentPanel>
        <div className="flex items-center justify-between gap-3">
          <SectionHeader eyebrow="รายการยื่นของฉัน" title="ติดตามสถานะคำขอรับการพิจารณาจริยธรรม" />
        </div>
        <div className="mt-4">
          {!user ? (
            <EmptyState icon={<Clock className="w-12 h-12 stroke-[1.5]" />} title="เข้าสู่ระบบเพื่อติดตามสถานะ" body="จำเป็นต้องลงชื่อเข้าใช้ก่อนดูประวัติคำขอ" dashed />
          ) : submissions.length === 0 ? (
            <EmptyState icon={<Clipboard className="w-10 h-10 stroke-[1.5]" />} title="ยังไม่มีประวัติการยื่นคำขอ" body="คลิกปุ่ม 'ยื่นโครงร่างวิจัยขอรับการพิจารณา' ด้านบนเพื่อส่งเอกสารครั้งแรก" />
          ) : (
            <>
              {/* Desktop Table View (hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto rounded-3xl border border-[#E2E8F0] bg-white shadow-flip-card">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#F2F8F7] border-b border-[#CBD5E1]">
                      {['ชื่อโครงร่างวิจัย', 'เอกสารแนบ', 'สถานะ', 'ความเห็นผู้ทรงคุณวุฒิ', 'วันที่ยื่น', 'จัดการ'].map(h => (
                        <th key={h} className="py-3.5 px-4 font-mono font-black uppercase text-[10px] tracking-wider text-[#0F172A]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {submissions.map((sub) => {
                      const subAttach = attachments.filter(a => a.submission_id === sub.id)
                      return (
                        <tr key={sub.id} className="transition-colors hover:bg-[#F8FAFC]">
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-extrabold text-[#0F172A]">{sub.project_title}</div>
                            {sub.project_description && <p className="text-[11px] font-medium text-[#64748B] mt-0.5">{sub.project_description}</p>}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1.5 max-w-[180px]">
                              {subAttach.map((at) => (
                                <button key={at.id} onClick={() => handleDownloadFile(at.file_url)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-[#00796B] bg-[#F0F7FF] border border-[#DAEEFF] hover:bg-[#E0F2FE] transition-colors truncate cursor-pointer shadow-xs max-w-full" title={at.file_name}>
                                  <FileText className="w-3.5 h-3.5 shrink-0" /> {at.file_name}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap"><StatusBadge status={sub.status} size="sm" /></td>
                          <td className="py-3.5 px-4 max-w-[200px]">
                            <div className="text-xs font-semibold italic text-[#64748B] truncate" title={sub.reviewer_notes}>
                              {sub.reviewer_notes ? sub.reviewer_notes.replace(/\[.*?\]/g, '').trim() : '—'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-mono font-bold text-[#64748B] whitespace-nowrap">{new Date(sub.created_at).toLocaleDateString('th-TH')}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col sm:flex-row gap-1.5">
                              {sub.reviewer_notes && (
                                <button
                                  onClick={() => handleExportClick(sub)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-[#DAEEFF] bg-[#F0F7FF] text-[#00796B] hover:bg-[#00796B] hover:text-white transition cursor-pointer shadow-xs"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  รายงานผล
                                </button>
                              )}

                              {sub.status === 'รอแก้ไข' && (
                                <button
                                  onClick={() => handleOpenRevisionModal(sub)}
                                  className="btn-primary text-xs flex items-center gap-1.5 !py-1.5 !px-3"
                                >
                                  <UploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                                  ส่งเล่มปรับปรุง
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteSubmission(sub.id)}
                                className="btn-coral text-xs flex items-center gap-1.5 !py-1.5 !px-3"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                ลบคำขอ
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (visible on mobile < md) */}
              <div className="md:hidden space-y-3">
                {submissions.map((sub) => {
                  const subAttach = attachments.filter(a => a.submission_id === sub.id)
                  return (
                    <div key={sub.id} className="rounded-3xl p-4 bg-white border border-[#E2E8F0] shadow-flip-card space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b border-[#F1F5F9] pb-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-[#0F172A]">{sub.project_title}</h4>
                          {sub.project_description && <p className="text-[11px] font-medium text-[#64748B] mt-0.5">{sub.project_description}</p>}
                        </div>
                        <StatusBadge status={sub.status} size="sm" />
                      </div>

                      {subAttach.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-black uppercase text-[#64748B] tracking-wider">เอกสารแนบ:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {subAttach.map((at) => (
                              <button key={at.id} onClick={() => handleDownloadFile(at.file_url)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-[#00796B] bg-[#F0F7FF] border border-[#DAEEFF] hover:bg-[#E0F2FE] transition-colors truncate shadow-xs max-w-full" title={at.file_name}>
                                <FileText className="w-3.5 h-3.5 shrink-0" /> {at.file_name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {sub.reviewer_notes && (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono font-black uppercase text-[#64748B] tracking-wider">ความเห็นผู้ทรงคุณวุฒิ:</span>
                          <p className="text-xs font-semibold italic text-[#64748B]">{sub.reviewer_notes.replace(/\[.*?\]/g, '').trim() || '—'}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                        <span className="text-[10px] font-mono font-bold text-[#64748B]">ยื่นเมื่อ: {new Date(sub.created_at).toLocaleDateString('th-TH')}</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {sub.reviewer_notes && (
                            <button
                              onClick={() => handleExportClick(sub)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border border-[#DAEEFF] bg-[#F0F7FF] text-[#00796B] shadow-xs"
                            >
                              <ExternalLink className="w-3 h-3" /> รายงานผล
                            </button>
                          )}
                          {sub.status === 'รอแก้ไข' && (
                            <button
                              onClick={() => handleOpenRevisionModal(sub)}
                              className="btn-primary text-xs flex items-center gap-1 !py-1 !px-2.5"
                            >
                              <UploadCloud className="w-3 h-3" /> แก้ไข
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSubmission(sub.id)}
                            className="btn-coral text-xs flex items-center gap-1 !py-1 !px-2.5"
                          >
                            <Trash2 className="w-3 h-3" /> ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </ContentPanel>

      {/* SECTION 3: REVIEW COMMITTEE QUEUE (EXPERT/ADMIN ONLY) */}
      {isReviewTabVisible && (
        <ContentPanel>
          <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3 mb-4">
            <SectionHeader eyebrow="คิวพิจารณาจริยธรรม" title="กล่องงานพิจารณาโครงร่างวิจัย (สำหรับคณะกรรมการ & ผู้ทรงคุณวุฒิ)" />
            <Briefcase className="w-5 h-5 text-[#00796B] shrink-0" />
          </div>
          <div className="mt-4">
            {reviewSubmissions.length === 0 ? (
              <EmptyState icon={<UserCheck className="w-10 h-10 stroke-[1.5]" />} title="ไม่มีรายการในคิวขณะนี้" body="เมื่อแอดมินมอบหมายงาน รายการจะปรากฏที่นี่" dashed />
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto rounded-3xl border border-[#E2E8F0] bg-white shadow-flip-card">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-[#F2F8F7] border-b border-[#CBD5E1]">
                        {['โครงร่างวิจัย / เอกสาร', 'ผู้ยื่นคำขอ', 'สถานะ', 'ความเห็นรีวิว', 'จัดการ'].map(h => (
                          <th key={h} className="py-3.5 px-4 font-mono font-black uppercase text-[10px] tracking-wider text-[#0F172A]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] bg-white">
                      {reviewSubmissions.map((sub) => {
                        const subAttach = attachments.filter(a => a.submission_id === sub.id)
                        return (
                          <tr key={sub.id} className="transition-colors hover:bg-[#F8FAFC]">
                            <td className="py-3.5 px-4 max-w-[280px]">
                              <div className="text-xs font-extrabold text-[#0F172A]">{sub.project_title}</div>
                              {sub.project_description && <p className="text-[11px] font-medium text-[#64748B] mt-0.5">{sub.project_description}</p>}
                              {subAttach.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {subAttach.map((at) => (
                                    <button key={at.id} onClick={() => handleDownloadFile(at.file_url)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-[#00796B] bg-[#F0F7FF] border border-[#DAEEFF] hover:bg-[#E0F2FE] cursor-pointer transition-colors truncate shadow-xs max-w-full" title={at.file_name}>
                                      <FileText className="w-3.5 h-3.5 shrink-0" /> {at.file_name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-extrabold text-[#0F172A]">
                              {sub.profiles?.email || 'ไม่ระบุผู้ยื่น'}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <StatusBadge status={sub.status} size="sm" />
                            </td>
                            <td className="py-3.5 px-4 max-w-[200px]">
                              <div className="text-xs font-semibold italic text-[#64748B] truncate" title={sub.reviewer_notes}>
                                {sub.reviewer_notes ? sub.reviewer_notes.replace(/\[.*?\]/g, '').trim() : '—'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="flex gap-1.5 justify-center">
                                <Button
                                  onClick={() => {
                                    setSelectedSubForReview(sub)
                                    setReviewStatus(sub.status)
                                    const parsed = parseReviewerNotes(sub.reviewer_notes || '')
                                    setScores(parsed.scores)

                                    let cleanComments = parsed.comments
                                    const tagMatch = cleanComments.match(/^\[(.*?)\]\s*\n?/)
                                    if (tagMatch) {
                                      setReviewerRoleLabel(tagMatch[1])
                                      cleanComments = cleanComments.replace(/^\[(.*?)\]\s*\n?/, '')
                                    } else {
                                      const currentIsExpert = hasRole(profile?.role, 'expert')
                                      setReviewerRoleLabel(
                                        currentIsExpert && profile?.email
                                          ? profile.email
                                          : (expertProfiles[0]?.email || 'ผู้ทรงคุณวุฒิท่านที่ 1')
                                      )
                                    }

                                    setReviewNotes(cleanComments)
                                    setReviewModalOpen(true)
                                  }}
                                  className="px-3.5 py-1.5 h-auto rounded-full text-xs font-extrabold border border-[#DAEEFF] bg-[#F0F7FF] text-[#00796B] hover:bg-[#00796B] hover:text-white transition cursor-pointer shadow-xs"
                                >
                                  พิจารณาผล
                                </Button>

                                {sub.reviewer_notes && (
                                  <button
                                    onClick={() => handleExportClick(sub)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-[#DAEEFF] bg-[#F0F7FF] text-[#00796B] hover:bg-[#E0F2FE] transition cursor-pointer shadow-xs"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-[#00796B]" />
                                    พิมพ์รายงาน
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  {reviewSubmissions.map((sub) => {
                    const subAttach = attachments.filter(a => a.submission_id === sub.id)
                    return (
                      <div key={sub.id} className="rounded-3xl p-4 bg-white border border-[#E2E8F0] shadow-flip-card space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-[#F1F5F9] pb-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-[#0F172A]">{sub.project_title}</h4>
                            <p className="text-[10px] font-extrabold text-[#64748B] mt-0.5">ผู้ยื่น: {sub.profiles?.email || 'ไม่ระบุ'}</p>
                          </div>
                          <StatusBadge status={sub.status} size="sm" />
                        </div>

                        {subAttach.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-black uppercase text-[#64748B] tracking-wider">เอกสาร:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {subAttach.map((at) => (
                                <button key={at.id} onClick={() => handleDownloadFile(at.file_url)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-[#00796B] bg-[#F0F7FF] border border-[#DAEEFF] truncate shadow-xs max-w-full" title={at.file_name}>
                                  <FileText className="w-3.5 h-3.5 shrink-0" /> {at.file_name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-end gap-2">
                          <Button
                            onClick={() => {
                              setSelectedSubForReview(sub)
                              setReviewStatus(sub.status)
                              const parsed = parseReviewerNotes(sub.reviewer_notes || '')
                              setScores(parsed.scores)

                              let cleanComments = parsed.comments
                              const tagMatch = cleanComments.match(/^\[(.*?)\]\s*\n?/)
                              if (tagMatch) {
                                setReviewerRoleLabel(tagMatch[1])
                                cleanComments = cleanComments.replace(/^\[(.*?)\]\s*\n?/, '')
                              } else {
                                const currentIsExpert = hasRole(profile?.role, 'expert')
                                setReviewerRoleLabel(
                                  currentIsExpert && profile?.email
                                    ? profile.email
                                    : (expertProfiles[0]?.email || 'ผู้ทรงคุณวุฒิท่านที่ 1')
                                )
                              }

                              setReviewNotes(cleanComments)
                              setReviewModalOpen(true)
                            }}
                            className="px-3.5 py-1.5 h-auto rounded-full text-xs font-extrabold border border-[#DAEEFF] bg-[#F0F7FF] text-[#00796B] hover:bg-[#00796B] hover:text-white transition cursor-pointer shadow-xs"
                          >
                            พิจารณาผล
                          </Button>

                          {sub.reviewer_notes && (
                            <button
                              onClick={() => handleExportClick(sub)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border border-[#DAEEFF] bg-[#F0F7FF] text-[#00796B] shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#00796B]" />
                              พิมพ์รายงาน
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </ContentPanel>
      )}

      {/* MODAL: SUBMIT NEW PROPOSAL */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-white border border-[#E2F1F0] text-[#1E8C86] rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E2F1F0] bg-[#F4FAF9]">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#2BA8A2]">ยื่นคำขอ IRB</p>
            <DialogTitle className="header-display text-lg font-black text-[#1E8C86]">ยื่นโครงร่างวิจัยขอรับการพิจารณาจริยธรรม</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5">
            {!user ? (
              <EmptyState icon={<UploadCloud className="w-12 h-12 stroke-[1.5]" />} title="เข้าสู่ระบบเพื่อยื่นเอกสาร" body="จำเป็นต้องลงชื่อเข้าใช้ก่อนอัปโหลดไฟล์และยื่นโครงร่างวิจัย" dashed />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs font-semibold text-[#64748B]">แนบไฟล์แบบฟอร์มที่ระบุรายละเอียดครบถ้วนและลงลายมือชื่อแล้ว</p>

                {formError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-extrabold bg-[#FFF0ED] text-[#EF6C4A] border border-[#FF8A6A]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-extrabold bg-[#EBFBEE] text-[#27AE60] border border-[#A3E2B6]">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {formSuccess}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">ชื่อโครงร่างวิจัย *</label>
                    <Input type="text" required placeholder="ระบุชื่อโครงการวิจัย (ภาษาไทยและอังกฤษ)..." value={title} onChange={(e) => setTitle(e.target.value)} className={inputBase} style={inputSty} />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">รายละเอียดสรุปย่อ</label>
                    <Textarea rows={3} placeholder="วัตถุประสงค์หรือรายละเอียดเบื้องต้นของโครงการ..." value={desc} onChange={(e) => setDesc(e.target.value)} className={inputBase + ' resize-none'} style={inputSty} />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">อัปโหลดเอกสารประกอบ * <span className="font-normal text-[#64748B]">(เลือกได้หลายไฟล์)</span></label>
                    <Input type="file" id="ethics-files" multiple required accept=".pdf,.doc,.docx" onChange={(e) => setFiles(e.target.files)} className={inputBase + ' h-auto'} style={inputSty} />
                    <p className="text-[10px] mt-1 text-[#64748B] font-semibold">รองรับ PDF, Word เท่านั้น — ขนาดรวมไม่เกิน 25 MB</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 h-auto rounded-full text-sm font-extrabold disabled:opacity-50 mt-2 btn-primary"
                >
                  {isSubmitting ? 'กำลังอัปโหลดเอกสาร...' : 'ส่งคำขอยื่นจริยธรรม →'}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: SUBMIT REVISED PROPOSAL */}
      <Dialog open={revisionModalOpen} onOpenChange={setRevisionModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#64748B]">แก้ไขส่งปรับปรุง</p>
            <DialogTitle className="header-display text-lg font-black text-[#0F172A]">
              ส่งเล่มโครงร่างวิจัยฉบับแก้ไข
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5">
            {selectedSubForRevision && (
              <form onSubmit={handleSubmitRevision} className="space-y-4">
                <p className="text-xs font-semibold text-[#64748B]">
                  อัปโหลดไฟล์เล่มเสนอแนะปรับปรุง หรือเอกสารเพิ่มเติมตามคำแนะนำของผู้ทรงคุณวุฒิ
                </p>

                {revisionError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-extrabold bg-[#FFF0ED] text-[#EF6C4A] border border-[#FF8A6A]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {revisionError}
                  </div>
                )}
                {revisionSuccess && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-extrabold bg-[#EBFBEE] text-[#27AE60] border border-[#A3E2B6]">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {revisionSuccess}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">ชื่อโครงร่างวิจัย</label>
                    <Input type="text" disabled value={selectedSubForRevision.project_title} className="w-full text-xs px-4 py-2.5 rounded-2xl bg-[#F8FAFC] text-[#64748B] cursor-not-allowed" style={inputSty} />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">บันทึกแจ้งการแก้ไข / สรุปรายการแก้ *</label>
                    <Textarea rows={3} required placeholder="ระบุรายการจุดที่ปรับแก้ เช่น แก้แบบชี้แจงยินยอมฉบับที่ 2 แล้ว..." value={revisionNotes} onChange={(e) => setRevisionNotes(e.target.value)} className={inputBase + ' resize-none'} style={inputSty} />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">อัปโหลดเอกสารปรับปรุง * <span className="font-normal text-[#64748B]">(เลือกได้หลายไฟล์)</span></label>
                    <Input type="file" multiple required accept=".pdf,.doc,.docx" onChange={(e) => setRevisionFiles(e.target.files)} className={inputBase + ' h-auto'} style={inputSty} />
                    <p className="text-[10px] mt-1 text-[#64748B] font-semibold">รองรับ PDF, Word เท่านั้น — ขนาดรวมไม่เกิน 25 MB</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={revisionSubmitting}
                  className="w-full py-2.5 h-auto rounded-full text-xs font-extrabold disabled:opacity-50 mt-2 btn-primary"
                >
                  {revisionSubmitting ? 'กำลังอัปโหลดเอกสารแก้ไข...' : 'ยืนยันส่งเอกสารปรับปรุง →'}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: EXPERT EVALUATION SCORECARD */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#64748B]">พิจารณาข้อเสนอ</p>
            <DialogTitle className="header-display text-lg font-black text-[#0F172A]">
              ประเมินจริยธรรมโครงร่างวิจัย
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 overflow-y-auto max-h-[70vh] space-y-4">
            {selectedSubForReview && (
              <>
                <div>
                  <div className="text-xs font-extrabold text-[#64748B]">ชื่อโครงร่างวิจัย</div>
                  <div className="text-sm font-black mt-0.5 text-[#0F172A]">
                    {selectedSubForReview.project_title}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-extrabold text-[#0F172A]">ผลประเมินตามรายเกณฑ์</label>
                  <div className="space-y-3 bg-[#FFF8E7] border border-[#F3E5C8] p-3.5 rounded-2xl">
                    {(() => {
                      const criteriaOptions = getOptionsByCategory('ethics_criteria')
                      const activeCriteria = criteriaOptions.length > 0
                        ? criteriaOptions.map((opt, idx) => ({
                            key: `opt_${opt.id}`,
                            label: opt.value.startsWith(`${idx + 1}.`) ? opt.value : `${idx + 1}. ${opt.value}`
                          }))
                        : EVALUATION_CRITERIA

                      return activeCriteria.map((criterion) => (
                        <div key={criterion.key} className="space-y-1">
                          <div className="text-[10px] font-extrabold text-[#0F172A] leading-snug">{criterion.label}</div>
                          <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0]">
                            {[
                              { val: 'pass', label: 'ผ่าน', color: 'peer-checked:bg-[#16A34A] peer-checked:text-white text-[#16A34A]' },
                              { val: 'fail', label: 'ต้องแก้ไข', color: 'peer-checked:bg-[#D97706] peer-checked:text-white text-[#D97706]' },
                              { val: 'na', label: 'N/A', color: 'peer-checked:bg-[#64748B] peer-checked:text-white text-[#64748B]' }
                            ].map(opt => (
                              <label key={opt.val} className="cursor-pointer text-[10px] font-black text-center">
                                <input
                                  type="radio"
                                  name={`expert-score-${criterion.key}`}
                                  value={opt.val}
                                  checked={scores[criterion.key] === opt.val}
                                  onChange={() => setScores(prev => ({ ...prev, [criterion.key]: opt.val as any }))}
                                  className="sr-only peer"
                                />
                                <div className={`py-1 rounded-lg transition peer-checked:shadow-xs ${opt.color} hover:bg-[#F8FAFC]`}>
                                  {opt.label}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">ประเมินในนาม (เพื่อสถิติการแสดงผลรายงาน)</label>
                  <Select
                    value={reviewerRoleLabel}
                    onValueChange={(v) => setReviewerRoleLabel(v ?? '')}
                    items={
                      expertProfiles.length > 0
                        ? expertProfiles.map((p) => ({
                            value: p.email,
                            label: `${p.email} (${formatUserRolesText(p.role)})`
                          }))
                        : [
                            { value: 'ผู้ทรงคุณวุฒิท่านที่ 1', label: 'ผู้ทรงคุณวุฒิท่านที่ 1' },
                            { value: 'ผู้ทรงคุณวุฒิท่านที่ 2', label: 'ผู้ทรงคุณวุฒิท่านที่ 2' },
                          ]
                    }
                  >
                    <SelectTrigger className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl">
                      {expertProfiles.length > 0 ? (
                        expertProfiles.map((p) => (
                          <SelectItem key={p.id} value={p.email}>
                            {p.email} ({formatUserRolesText(p.role)})
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="ผู้ทรงคุณวุฒิท่านที่ 1">ผู้ทรงคุณวุฒิท่านที่ 1</SelectItem>
                          <SelectItem value="ผู้ทรงคุณวุฒิท่านที่ 2">ผู้ทรงคุณวุฒิท่านที่ 2</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">สถานะผลประเมิน</label>
                  <Select
                    value={reviewStatus}
                    onValueChange={(v) => setReviewStatus(v ?? 'กำลังตรวจ')}
                    items={['กำลังตรวจ', 'รอแก้ไข', 'อนุมัติ', 'ไม่อนุมัติ'].map((s) => ({ value: s, label: s }))}
                  >
                    <SelectTrigger className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl">
                      <SelectItem value="กำลังตรวจ">กำลังตรวจ</SelectItem>
                      <SelectItem value="รอแก้ไข">รอแก้ไข (ให้ปรับปรุงเล่ม)</SelectItem>
                      <SelectItem value="อนุมัติ">อนุมัติ</SelectItem>
                      <SelectItem value="ไม่อนุมัติ">ไม่อนุมัติ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">ข้อแนะนำและคอมเมนต์เพิ่มเติม</label>
                  <Textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="เขียนรายละเอียดจุดแก้ไข หรือความเห็นเพิ่มเติม..."
                    className={inputBase + ' resize-none'}
                    style={inputSty}
                  />
                </div>

                <Button
                  onClick={() => {
                    const taggedNotes = `[${reviewerRoleLabel}]\n${reviewNotes}`
                    const serialized = serializeReviewerNotes(scores, taggedNotes)
                    handleSaveReview(selectedSubForReview.id, reviewStatus, serialized)
                    setReviewModalOpen(false)
                  }}
                  className="w-full py-2.5 h-auto rounded-full text-xs font-extrabold mt-2 btn-primary"
                >
                  บันทึกผลการประเมิน
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setSubIdToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="ยืนยันการลบคำขอ?"
        description="คุณต้องการลบคำขอรับการพิจารณาจริยธรรมนี้หรือไม่? เอกสารแนบทั้งหมดของคำขอนี้จะถูกลบออกถาวร"
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
