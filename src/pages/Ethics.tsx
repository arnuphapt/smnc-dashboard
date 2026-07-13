import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
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
  Trash2
} from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { PageHeader, ContentPanel, SectionHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
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
import { ConfirmDialog } from '../components/ConfirmDialog'

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

const inputBase = "w-full text-sm px-4 py-2.5 rounded-xl focus:outline-none transition-all duration-200"
const inputSty = { border: '1.5px solid #CBD5E1', background: '#FAFCFF' }

export const Ethics: React.FC = () => {
  const { user, profile } = useAuth()

  const [forms, setForms] = useState<DownloadableForm[]>([])
  const [submissions, setSubmissions] = useState<EthicsSubmission[]>([])
  const [attachments, setAttachments] = useState<EthicsAttachment[]>([])
  const [reviewSubmissions, setReviewSubmissions] = useState<any[]>([])

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)

  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewStatus, setReviewStatus] = useState('กำลังตรวจ')

  // Revision modal states
  const [revisionModalOpen, setRevisionModalOpen] = useState(false)
  const [selectedSubForRevision, setSelectedSubForRevision] = useState<any | null>(null)
  const [revisionFiles, setRevisionFiles] = useState<FileList | null>(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [revisionSubmitting, setRevisionSubmitting] = useState(false)
  const [revisionError, setRevisionError] = useState('')
  const [revisionSuccess, setRevisionSuccess] = useState('')

  // Delete confirm modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [subIdToDelete, setSubIdToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Custom Alert Dialog States
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{ title: string; description: string; variant?: 'primary' | 'danger' | 'warning' } | null>(null)

  const triggerAlert = (title: string, description: string, variant: 'primary' | 'danger' | 'warning' = 'primary') => {
    setAlertConfig({ title, description, variant })
    setAlertDialogOpen(true)
  }

  // Expert review modal states
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
      if (profile?.role === 'expert') query = query.eq('assigned_reviewer_id', user.id)
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

  useEffect(() => {
    fetchForms()
    fetchAttachments()
    fetchSubmissions()
    fetchReviewSubmissions()
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
      setFormSuccess('ยื่นคำขอรับการพิจารณาจริยธรรมเรียบร้อยแล้ว! ติดตามสถานะได้ที่หัวข้อติดตามสถานะด้านล่าง')
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

  const isReviewTabVisible = profile?.role === 'expert' || profile?.role === 'admin'

  return (
    <div className="flex-1 space-y-6 animate-fadeIn">
      <PageHeader
        title="จริยธรรมการวิจัย"
        subtitle="Research Ethics — ยื่น ติดตาม และพิจารณาคำขอรับรองจริยธรรม"
        extraBadge="Ethics Review System"
        recordCode="ETH-02"
      />

      {/* SECTION: FORMS */}
      <ContentPanel>
        <SectionHeader eyebrow="แบบฟอร์มทางการ" title="รายการแบบฟอร์มยื่นขอรับรองจริยธรรม" />
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
          {user && (
            <Button
              onClick={handleOpenSubmitModal}
              className="shrink-0 h-auto py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer text-white"
              style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              ยื่นคำขอรับการพิจารณา
            </Button>
          )}
        </div>
        <div className="mt-4">
          {!user ? (
            <EmptyState icon={<Clock className="w-12 h-12 stroke-[1.5]" />} title="เข้าสู่ระบบเพื่อติดตามสถานะ" body="จำเป็นต้องลงชื่อเข้าใช้ก่อนดูประวัติคำขอ" dashed />
          ) : submissions.length === 0 ? (
            <EmptyState icon={<Clipboard className="w-10 h-10 stroke-[1.5]" />} title="ยังไม่มีประวัติการยื่นคำขอ" />
          ) : (
            <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #E8F0F8' }}>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr style={{ background: '#F0F7FF', borderBottom: '1px solid #DAEEFF' }}>
                    {['ชื่อโครงร่างวิจัย', 'เอกสารแนบ', 'สถานะ', 'ความเห็นผู้ทรงคุณวุฒิ', 'วันที่ยื่น', 'จัดการ'].map(h => (
                      <th key={h} className="py-3 px-4 font-extrabold uppercase text-[10px] tracking-wider" style={{ color: '#64748B' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#E8F0F8' }}>
                  {submissions.map((sub) => {
                    const subAttach = attachments.filter(a => a.submission_id === sub.id)
                    return (
                      <tr key={sub.id} className="transition-colors hover:bg-blue-50/30">
                        <td className="py-3 px-4">
                          <div className="font-bold" style={{ color: '#0B1D3A' }}>{sub.project_title}</div>
                          {sub.project_description && <p className="text-[10px] mt-1" style={{ color: '#94A3B8' }}>{sub.project_description}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1.5 max-w-[180px]">
                            {subAttach.map((at) => (
                              <button key={at.id} onClick={() => handleDownloadFile(at.file_url)} className="inline-flex items-center gap-1 text-[10px] font-bold text-left hover:underline truncate cursor-pointer" style={{ color: '#0EA5A0' }} title={at.file_name}>
                                <FileText className="w-3.5 h-3.5 shrink-0" /> {at.file_name}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap"><StatusBadge status={sub.status} /></td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="italic font-medium text-slate-500 truncate" title={sub.reviewer_notes}>
                            {sub.reviewer_notes ? sub.reviewer_notes.replace(/\[.*?\]/g, '').trim() : '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold whitespace-nowrap" style={{ color: '#94A3B8' }}>{new Date(sub.created_at).toLocaleDateString('th-TH')}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col sm:flex-row gap-1">
                            {sub.reviewer_notes && (
                              <button
                                onClick={() => handleExportClick(sub)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border border-slate-200 transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
                                style={{ background: '#FFFFFF', color: '#475569' }}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                รายงานผล
                              </button>
                            )}

                            {sub.status === 'รอแก้ไข' && (
                              <button
                                onClick={() => handleOpenRevisionModal(sub)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer text-white"
                                style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                ส่งเล่มปรับปรุง
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
                              style={{ background: '#FFF1F2', color: '#9F1239', borderColor: '#FECDD3' }}
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
          )}
        </div>
      </ContentPanel>
 
      {/* SECTION: REVIEW (EXPERT/ADMIN ONLY) */}
      {isReviewTabVisible && (
        <ContentPanel>
          <div className="flex items-center gap-2">
            <SectionHeader eyebrow="คิวงานพิจารณา" title="กล่องงานพิจารณาจริยธรรมของคุณ" />
            <Briefcase className="w-5 h-5 ml-auto" style={{ color: '#7E22CE' }} />
          </div>
          <div className="mt-4">
            {reviewSubmissions.length === 0 ? (
              <EmptyState icon={<UserCheck className="w-10 h-10 stroke-[1.5]" />} title="ไม่มีรายการในคิวขณะนี้" body="เมื่อแอดมินมอบหมายงาน รายการจะปรากฏที่นี่" dashed />
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #E8F0F8' }}>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr style={{ background: '#F0F7FF', borderBottom: '1px solid #DAEEFF' }}>
                      {['โครงร่างวิจัย / เอกสาร', 'ผู้ยื่นคำขอ', 'สถานะ', 'ความเห็นรีวิว', 'จัดการ'].map(h => (
                        <th key={h} className="py-3 px-4 font-extrabold uppercase text-[10px] tracking-wider" style={{ color: '#64748B' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white" style={{ borderColor: '#E8F0F8' }}>
                    {reviewSubmissions.map((sub) => {
                      const subAttach = attachments.filter(a => a.submission_id === sub.id)
                      return (
                        <tr key={sub.id} className="transition-colors hover:bg-blue-50/30">
                          <td className="py-3 px-4 max-w-[280px]">
                            <div className="font-bold" style={{ color: '#0B1D3A' }}>{sub.project_title}</div>
                            {sub.project_description && <p className="text-[10px] mt-1" style={{ color: '#94A3B8' }}>{sub.project_description}</p>}
                            {subAttach.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {subAttach.map((at) => (
                                  <button key={at.id} onClick={() => handleDownloadFile(at.file_url)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold cursor-pointer transition-colors" style={{ background: '#FAF5FF', color: '#7E22CE', border: '1px solid #D8B4FE' }} title={at.file_name}>
                                    <FileText className="w-3 h-3" /> {at.file_name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold" style={{ color: '#0B1D3A' }}>
                            {sub.profiles?.email || 'ไม่ระบุผู้ยื่น'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusBadge status={sub.status} />
                          </td>
                          <td className="py-3 px-4 max-w-[200px]">
                            <div className="italic font-medium text-slate-500 truncate" title={sub.reviewer_notes}>
                              {sub.reviewer_notes ? sub.reviewer_notes.replace(/\[.*?\]/g, '').trim() : '—'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex gap-1.5 justify-center">
                              <Button
                                onClick={() => {
                                  setSelectedSubForReview(sub)
                                  setReviewStatus(sub.status)
                                  const parsed = parseReviewerNotes(sub.reviewer_notes || '')
                                  setScores(parsed.scores)
                                  setReviewNotes(parsed.comments)
                                  setReviewModalOpen(true)
                                }}
                                className="px-3 py-1.5 h-auto rounded-lg text-[10px] font-bold hover:-translate-y-0.5"
                                style={{ background: '#FAF5FF', color: '#7E22CE', border: '1px solid #D8B4FE' }}
                              >
                                พิจารณาผล
                              </Button>

                              {sub.reviewer_notes && (
                                <button
                                  onClick={() => handleExportClick(sub)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
                                  style={{ background: '#FFFFFF', color: '#475569' }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
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
            )}
          </div>
        </ContentPanel>
      )}

      {/* MODAL: submit a new Ethics submission */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F0F7FF' }}>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: '#0EA5A0' }}>ยื่นคำขอ</p>
            <DialogTitle className="header-display text-lg font-bold" style={{ color: '#0B1D3A' }}>ยื่นโครงร่างวิจัยขอรับการพิจารณาจริยธรรม</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5">
            {!user ? (
              <EmptyState icon={<UploadCloud className="w-12 h-12 stroke-[1.5]" />} title="เข้าสู่ระบบเพื่อยื่นเอกสาร" body="จำเป็นต้องลงชื่อเข้าใช้ก่อนอัปโหลดไฟล์และยื่นโครงร่างวิจัย" dashed />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs font-medium" style={{ color: '#64748B' }}>แนบไฟล์แบบฟอร์มที่ระบุรายละเอียดครบถ้วนและลงลายมือชื่อแล้ว</p>

                {formError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: '#FFF1F2', color: '#9F1239', border: '1px solid #FECDD3' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {formSuccess}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>ชื่อโครงร่างวิจัย *</label>
                    <Input type="text" required placeholder="ระบุชื่อโครงการวิจัย (ภาษาไทยและอังกฤษ)..." value={title} onChange={(e) => setTitle(e.target.value)} className={inputBase} style={inputSty} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>รายละเอียดสรุปย่อ</label>
                    <Textarea rows={3} placeholder="วัตถุประสงค์หรือรายละเอียดเบื้องต้นของโครงการ..." value={desc} onChange={(e) => setDesc(e.target.value)} className={inputBase + ' resize-none'} style={inputSty} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>อัปโหลดเอกสารประกอบ * <span className="font-normal" style={{ color: '#94A3B8' }}>(เลือกได้หลายไฟล์)</span></label>
                    <Input type="file" id="ethics-files" multiple required accept=".pdf,.doc,.docx" onChange={(e) => setFiles(e.target.files)} className={inputBase + ' h-auto'} style={inputSty} />
                    <p className="text-[10px] mt-1" style={{ color: '#94A3B8' }}>รองรับ PDF, Word เท่านั้น — ขนาดรวมไม่เกิน 25 MB</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 h-auto rounded-xl text-sm font-bold disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)', color: '#FFFFFF' }}
                >
                  {isSubmitting ? 'กำลังอัปโหลดเอกสาร...' : 'ส่งคำขอยื่นจริยธรรม →'}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: Researcher submits revised proposal documents */}
      <Dialog open={revisionModalOpen} onOpenChange={setRevisionModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F0F7FF' }}>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: '#0EA5A0' }}>แก้ไขส่งปรับปรุง</p>
            <DialogTitle className="header-display text-lg font-bold" style={{ color: '#0B1D3A' }}>
              ส่งเล่มโครงร่างวิจัยฉบับแก้ไข
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5">
            {selectedSubForRevision && (
              <form onSubmit={handleSubmitRevision} className="space-y-4">
                <p className="text-xs font-medium text-slate-500">
                  อัปโหลดไฟล์เล่มเสนอแนะปรับปรุง หรือเอกสารเพิ่มเติมตามคำแนะนำของผู้ทรงคุณวุฒิ
                </p>

                {revisionError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: '#FFF1F2', color: '#9F1239', border: '1px solid #FECDD3' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {revisionError}
                  </div>
                )}
                {revisionSuccess && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {revisionSuccess}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>ชื่อโครงร่างวิจัย</label>
                    <Input type="text" disabled value={selectedSubForRevision.project_title} className="w-full text-xs px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" style={inputSty} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>บันทึกแจ้งการแก้ไข / สรุปรายการแก้ *</label>
                    <Textarea rows={3} required placeholder="ระบุรายการจุดที่ปรับแก้ เช่น แก้แบบชี้แจงยินยอมฉบับที่ 2 แล้ว..." value={revisionNotes} onChange={(e) => setRevisionNotes(e.target.value)} className={inputBase + ' resize-none'} style={inputSty} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>อัปโหลดเอกสารปรับปรุง * <span className="font-normal text-slate-400">(เลือกได้หลายไฟล์)</span></label>
                    <Input type="file" multiple required accept=".pdf,.doc,.docx" onChange={(e) => setRevisionFiles(e.target.files)} className={inputBase + ' h-auto'} style={inputSty} />
                    <p className="text-[10px] mt-1 text-slate-400">รองรับ PDF, Word เท่านั้น — ขนาดรวมไม่เกิน 25 MB</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={revisionSubmitting}
                  className="w-full py-2.5 h-auto rounded-xl text-xs font-bold disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)', color: '#FFFFFF' }}
                >
                  {revisionSubmitting ? 'กำลังอัปโหลดเอกสารแก้ไข...' : 'ยืนยันส่งเอกสารปรับปรุง →'}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: Expert review evaluation checklist scorecard */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F0F7FF' }}>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: '#7E22CE' }}>พิจารณาข้อเสนอ</p>
            <DialogTitle className="header-display text-lg font-bold" style={{ color: '#0B1D3A' }}>
              ประเมินจริยธรรมโครงร่างวิจัย
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 overflow-y-auto max-h-[70vh] space-y-4">
            {selectedSubForReview && (
              <>
                <div>
                  <div className="text-xs font-bold text-slate-400">ชื่อโครงร่างวิจัย</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: '#0B1D3A' }}>
                    {selectedSubForReview.project_title}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold" style={{ color: '#0B1D3A' }}>ผลประเมินตามรายเกณฑ์</label>
                  <div className="space-y-3 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                    {EVALUATION_CRITERIA.map((criterion) => (
                      <div key={criterion.key} className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-700 leading-snug">{criterion.label}</div>
                        <div className="grid grid-cols-3 gap-1 bg-slate-200/50 p-0.5 rounded-lg">
                          {[
                            { val: 'pass', label: 'ผ่าน', color: 'peer-checked:bg-emerald-500 peer-checked:text-white text-emerald-700' },
                            { val: 'fail', label: 'ต้องแก้ไข', color: 'peer-checked:bg-amber-500 peer-checked:text-white text-amber-700' },
                            { val: 'na', label: 'N/A', color: 'peer-checked:bg-slate-400 peer-checked:text-white text-slate-600' }
                          ].map(opt => (
                            <label key={opt.val} className="cursor-pointer text-[10px] font-bold text-center">
                              <input
                                type="radio"
                                name={`expert-score-${criterion.key}`}
                                value={opt.val}
                                checked={scores[criterion.key] === opt.val}
                                onChange={() => setScores(prev => ({ ...prev, [criterion.key]: opt.val as any }))}
                                className="sr-only peer"
                              />
                              <div className={`py-1 rounded-md transition peer-checked:shadow-sm ${opt.color} hover:bg-slate-200/30`}>
                                {opt.label}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>สถานะผลประเมิน</label>
                  <Select
                    value={reviewStatus}
                    onValueChange={(v) => setReviewStatus(v ?? 'กำลังตรวจ')}
                    items={['กำลังตรวจ', 'รอแก้ไข', 'อนุมัติ', 'ไม่อนุมัติ'].map((s) => ({ value: s, label: s }))}
                  >
                    <SelectTrigger className="w-full light-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="กำลังตรวจ">กำลังตรวจ</SelectItem>
                      <SelectItem value="รอแก้ไข">รอแก้ไข (ให้ปรับปรุงเล่ม)</SelectItem>
                      <SelectItem value="อนุมัติ">อนุมัติ</SelectItem>
                      <SelectItem value="ไม่อนุมัติ">ไม่อนุมัติ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>ข้อแนะนำและคอมเมนต์เพิ่มเติม</label>
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
                    const serialized = serializeReviewerNotes(scores, reviewNotes)
                    handleSaveReview(selectedSubForReview.id, reviewStatus, serialized)
                    setReviewModalOpen(false)
                  }}
                  className="w-full py-2.5 h-auto rounded-xl text-xs font-bold mt-2"
                  style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)', color: '#FFFFFF' }}
                >
                  บันทึกคำพิจารณา
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
