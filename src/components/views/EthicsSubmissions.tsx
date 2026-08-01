'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
  Trash2,
  FileEdit,
  FileCheck,
  Eye,
  RotateCcw,
  ClipboardCheck,
  UserCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { PageHeader, ContentPanel, SectionHeader } from '@/components/PageHeader'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  EVALUATION_CRITERIA,
  RISK_LEVEL_OPTIONS,
  REPORT_INTERVAL_OPTIONS,
  parseReviewerNotes,
  serializeReviewerNotes,
  handleExportEvaluation
} from './masterdata/EthicsTab'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface EthicsSubmission {
  id: string
  project_title: string
  project_description?: string
  status: string
  assigned_reviewer_id?: string
  assigned_reviewer_id_2?: string
  submitter_id?: string
  reviewer_notes?: string
  created_at: string
  profiles?: { email?: string }
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

const PENDING_STATUSES = ['ยื่นแล้ว', 'กำลังตรวจ', 'รอแก้ไข']
const APPROVED_STATUSES = ['อนุมัติ', 'ไม่อนุมัติ']

export const EthicsSubmissions: React.FC = () => {
  const { user, profile } = useAuth()
  const { getOptionsByCategory } = useMasters()

  const [submissions, setSubmissions] = useState<EthicsSubmission[]>([])
  const [attachments, setAttachments] = useState<EthicsAttachment[]>([])
  const [reviewSubmissions, setReviewSubmissions] = useState<any[]>([])
  const [expertProfiles, setExpertProfiles] = useState<Profile[]>([])

  const [activeQueueTab, setActiveQueueTab] = useState<'all' | 'submitted' | 'reviewing' | 'revision' | 'approved'>('all')

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

  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [selectedSubForNotes, setSelectedSubForNotes] = useState<EthicsSubmission | null>(null)

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedSubForAssign, setSelectedSubForAssign] = useState<EthicsSubmission | null>(null)
  const [assignReviewerId, setAssignReviewerId] = useState<string>('')
  const [assignReviewerId2, setAssignReviewerId2] = useState<string>('')

  // Temp Expert Credential States
  const [showNewExpertForm, setShowNewExpertForm] = useState(false)
  const [newExpertEmail, setNewExpertEmail] = useState('')
  const [creatingTempExpert, setCreatingTempExpert] = useState(false)
  const [tempCredentialResult, setTempCredentialResult] = useState<{
    email: string
    password: string
    loginUrl: string
    expiresAt: string
  } | null>(null)

  const handleCreateTempExpert = async (submissionId: string) => {
    if (!newExpertEmail.trim()) {
      triggerAlert('เกิดข้อผิดพลาด', 'กรุณาระบุอีเมลผู้ทรงคุณวุฒิ', 'danger')
      return
    }
    setCreatingTempExpert(true)
    try {
      const res = await fetch('/api/admin/create-temp-expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newExpertEmail.trim(), submissionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด')
      setTempCredentialResult(data)
      setShowNewExpertForm(false)
      setNewExpertEmail('')
      setAssignModalOpen(false)
      fetchReviewSubmissions()
      triggerAlert('สำเร็จ', 'สร้างบัญชีผู้ทรงคุณวุฒิชั่วคราวและมอบหมายเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', err.message, 'danger')
    } finally {
      setCreatingTempExpert(false)
    }
  }

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewStep, setReviewStep] = useState<number>(1)
  const [reviewFiles, setReviewFiles] = useState<FileList | null>(null)
  const [selectedSubForReview, setSelectedSubForReview] = useState<any | null>(null)
  const [riskLevel, setRiskLevel] = useState<string>('1')
  const [progressReportInterval, setProgressReportInterval] = useState<string>('12')
  const [scores, setScores] = useState<Record<string, 'pass' | 'fail' | 'na'>>({
    obj: 'pass',
    method: 'pass',
    privacy: 'pass',
    consent: 'pass',
    risk: 'pass',
    benefit: 'pass',
  })

  const handleAssignReviewer = async (subId: string, reviewerId: string | null, reviewerId2: string | null) => {
    if (reviewerId && reviewerId2 && reviewerId === reviewerId2) {
      triggerAlert('เกิดข้อผิดพลาด', 'กรุณาเลือกผู้ทรงคุณวุฒิ 2 ท่านไม่ให้ซ้ำกัน', 'danger')
      return
    }
    try {
      const { error } = await supabase
        .from('ethics_submissions')
        .update({ assigned_reviewer_id: reviewerId || null, assigned_reviewer_id_2: reviewerId2 || null })
        .eq('id', subId)
      if (error) throw error
      fetchReviewSubmissions()
      fetchSubmissions()
      triggerAlert('สำเร็จ', 'มอบหมายผู้ทรงคุณวุฒิเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', err.message, 'danger')
    }
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
        query = query.or(`assigned_reviewer_id.eq.${user.id},assigned_reviewer_id_2.eq.${user.id}`)
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
    fetchAttachments()
    fetchSubmissions()
    fetchReviewSubmissions()
    fetchExpertProfiles()
  }, [user, profile])

  useEffect(() => {
    if (!user) return
    const s = supabase.channel('ethics-list-sub-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_submissions' }, () => { fetchSubmissions(); fetchReviewSubmissions() }).subscribe()
    const a = supabase.channel('ethics-list-att-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_attachments' }, () => fetchAttachments()).subscribe()
    return () => { supabase.removeChannel(s); supabase.removeChannel(a) }
  }, [user, profile])

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

      if (reviewFiles && reviewFiles.length > 0) {
        for (let i = 0; i < reviewFiles.length; i++) {
          const file = reviewFiles[i]
          const extIndex = file.name.lastIndexOf('.')
          const ext = extIndex !== -1 ? file.name.substring(extIndex) : ''
          const base = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name
          const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, '_')
          const safeName = /[a-zA-Z0-9]/.test(sanitizedBase) ? sanitizedBase : 'doc'
          const storagePath = `ethics/${user?.id || 'eval'}/eval_${Date.now()}_${safeName}${ext}`

          const { error: uploadError } = await supabase.storage.from('wisdom-private').upload(storagePath, file)
          if (!uploadError) {
            await supabase.from('ethics_attachments').insert({
              submission_id: subId,
              file_url: storagePath,
              file_name: `[เอกสารประเมิน] ${file.name}`,
              file_type: file.type
            })
          }
        }
        setReviewFiles(null)
      }

      fetchReviewSubmissions()
      fetchSubmissions()
      fetchAttachments()
      triggerAlert('บันทึกสำเร็จ', 'บันทึกผลการพิจารณาและอัปโหลดเอกสารเรียบร้อยแล้ว!', 'primary')
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

  // Merge "my submissions" with the review queue (dedup by id) into a single list —
  // a reviewer's own submissions may not appear in reviewSubmissions if they aren't
  // also its assigned reviewer, so both sources are combined.
  const mergedSubmissions: EthicsSubmission[] = (() => {
    const byId = new Map<string, EthicsSubmission>()
    reviewSubmissions.forEach((sub) => byId.set(sub.id, sub))
    submissions.forEach((sub) => { if (!byId.has(sub.id)) byId.set(sub.id, sub) })
    return Array.from(byId.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  })()

  const waitingCount = mergedSubmissions.filter(s => s.status === 'ยื่นแล้ว').length
  const reviewingCount = mergedSubmissions.filter(s => s.status === 'กำลังตรวจ').length
  const revisionCount = mergedSubmissions.filter(s => s.status === 'รอแก้ไข').length
  const approvedCount = mergedSubmissions.filter(s => s.status === 'อนุมัติ').length

  const visibleSubmissions = mergedSubmissions.filter((s) => {
    if (activeQueueTab === 'submitted') return s.status === 'ยื่นแล้ว'
    if (activeQueueTab === 'reviewing') return s.status === 'กำลังตรวจ'
    if (activeQueueTab === 'revision') return s.status === 'รอแก้ไข'
    if (activeQueueTab === 'approved') return s.status === 'อนุมัติ' || s.status === 'ไม่อนุมัติ'
    return true
  })

  const openReviewModalFor = (sub: any) => {
    setSelectedSubForReview(sub)
    setReviewStep(1)
    setReviewFiles(null)
    const validStatuses = ['อนุมัติ', 'รอแก้ไข', 'ไม่อนุมัติ']
    setReviewStatus(validStatuses.includes(sub.status) ? sub.status : 'อนุมัติ')
    const parsed = parseReviewerNotes(sub.reviewer_notes || '')
    setScores(parsed.scores)
    setRiskLevel(parsed.riskLevel)
    setProgressReportInterval(parsed.progressReportInterval)

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
  }

  // Task 7: Auto-open assigned submission when landing via ?highlight=<id>
  const searchParams = useSearchParams()
  const highlightId = searchParams ? searchParams.get('highlight') : null
  const [hasAutoOpened, setHasAutoOpened] = useState(false)

  useEffect(() => {
    if (!highlightId || hasAutoOpened || reviewSubmissions.length === 0) return
    const target = reviewSubmissions.find((s) => s.id === highlightId)
    if (target) {
      openReviewModalFor(target)
      setHasAutoOpened(true)
    }
  }, [highlightId, hasAutoOpened, reviewSubmissions])

  const columns: DataTableColumn<EthicsSubmission>[] = [
    {
      key: 'project_title',
      header: 'ชื่อโครงร่างวิจัย',
      render: (sub) => (
        <>
          <div className="text-xs font-extrabold text-[#0F172A]">{sub.project_title}</div>
          {sub.project_description && <p className="text-[11px] font-medium text-[#64748B] mt-0.5">{sub.project_description}</p>}
        </>
      ),
    },
    ...(isReviewTabVisible ? [{
      key: 'submitter',
      header: 'ผู้ยื่นคำขอ',
      render: (sub: EthicsSubmission) => {
        const isOwner = sub.submitter_id === user?.id
        return <span className="whitespace-nowrap">{isOwner ? 'ฉัน' : (sub.profiles?.email || 'ไม่ระบุผู้ยื่น')}</span>
      },
    } as DataTableColumn<EthicsSubmission>] : []),
    {
      key: 'assigned_reviewer',
      header: 'ผู้ทรงคุณวุฒิที่มอบหมาย',
      render: (sub) => {
        const assignedUser = expertProfiles.find((p) => p.id === sub.assigned_reviewer_id)
        const assignedUser2 = expertProfiles.find((p) => p.id === sub.assigned_reviewer_id_2)
        if (!assignedUser && !assignedUser2) {
          return <span className="text-xs font-semibold text-[#64748B] whitespace-nowrap">ยังไม่ได้มอบหมาย</span>
        }
        return (
          <span className="text-xs font-semibold text-[#64748B] whitespace-nowrap">
            {[assignedUser?.email, assignedUser2?.email].filter(Boolean).join(', ')}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (sub) => <StatusBadge status={sub.status} size="sm" />,
    },
    {
      key: 'reviewer_notes',
      header: 'ความเห็นผู้ทรงคุณวุฒิ',
      align: 'center',
      render: (sub) => (
        sub.reviewer_notes ? (
          <button
            onClick={() => { setSelectedSubForNotes(sub); setNotesModalOpen(true) }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold text-[#00796B] bg-[#F0F7FF] border border-[#DAEEFF] hover:bg-[#E0F2FE] transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            title="ดูความเห็นผู้ทรงคุณวุฒิ"
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            ดูความคิดเห็น
          </button>
        ) : (
          <span className="text-xs text-[#94A3B8]">—</span>
        )
      ),
    },
    {
      key: 'created_at',
      header: 'วันที่ยื่น',
      render: (sub) => <span className="whitespace-nowrap">{new Date(sub.created_at).toLocaleDateString('th-TH')}</span>,
    },
    {
      key: 'จัดการ',
      header: 'จัดการ',
      align: 'center',
      render: (sub) => {
        const isOwner = sub.submitter_id === user?.id
        const canAssign = hasRole(profile?.role, 'admin') || hasRole(profile?.role, 'assistant_admin')
        const subAttach = attachments.filter((a) => a.submission_id === sub.id)
        return (
          <div className="flex flex-wrap gap-1.5 items-center justify-center">
            {canAssign && (
              <button
                onClick={() => {
                  setSelectedSubForAssign(sub)
                  setAssignReviewerId(sub.assigned_reviewer_id || '')
                  setAssignReviewerId2(sub.assigned_reviewer_id_2 || '')
                  setAssignModalOpen(true)
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white transition cursor-pointer shadow-xs whitespace-nowrap"
                title="มอบหมายผู้ทรงคุณวุฒิ"
              >
                <UserCheck className="w-3.5 h-3.5" />
                มอบหมายผู้ทรงคุณวุฒิ
              </button>
            )}
            {subAttach.map((at) => (
              <button
                key={at.id}
                onClick={() => handleDownloadFile(at.file_url)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[#00796B] bg-[#F0F7FF] border border-[#DAEEFF] hover:bg-[#E0F2FE] transition-colors cursor-pointer shadow-xs shrink-0"
                title={at.file_name}
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            ))}

            {isReviewTabVisible && (
              <Button
                onClick={() => openReviewModalFor(sub)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 h-auto rounded-full text-xs font-extrabold bg-[#00796B] text-white hover:bg-[#005F56] transition cursor-pointer"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                พิจารณาผล
              </Button>
            )}

            {sub.reviewer_notes && (
              <button
                onClick={() => handleExportClick(sub)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-[#DAEEFF] bg-[#F0F7FF] text-[#00796B] hover:bg-[#00796B] hover:text-white transition cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                รายงานผล
              </button>
            )}

            {isOwner && sub.status === 'รอแก้ไข' && (
              <button
                onClick={() => handleOpenRevisionModal(sub)}
                className="btn-primary text-xs flex items-center gap-1.5 !py-1.5 !px-3"
              >
                <UploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                ส่งเล่มปรับปรุง
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => handleDeleteSubmission(sub.id)}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold !py-1.5 !px-3 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#DC2626] hover:text-white transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบคำขอ
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex-1 space-y-6 animate-fadeIn">
      <PageHeader
        title="รวมคำขอยื่นจริยธรรม"
        subtitle="Research Ethics — ติดตามสถานะและพิจารณาคำขอรับรองจริยธรรมการวิจัยในมนุษย์ (IRB)"
        extraBadge="Ethics Review Board"
        action={
          <Link
            href="/ethics"
            className="shrink-0 btn-primary text-xs flex items-center gap-2 !py-2.5 !px-5"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            ยื่นโครงร่างวิจัยใหม่
          </Link>
        }
      />

      {/* UNIFIED DATA TABLE WITH CARDS, TABS & TABLE */}
      <DataTable<EthicsSubmission>
        summaryCards={[
          {
            key: 'waiting',
            count: waitingCount,
            label: 'ยื่นแล้ว / รอตรวจ',
            icon: <Clock className="w-5 h-5" />,
            iconBg: 'bg-[#E0F2FE]',
            iconColor: 'text-[#0284C7]',
          },
          {
            key: 'reviewing',
            count: reviewingCount,
            label: 'กำลังตรวจ',
            icon: <FileEdit className="w-5 h-5" />,
            iconBg: 'bg-[#F3E8FF]',
            iconColor: 'text-[#7C3AED]',
          },
          {
            key: 'revision',
            count: revisionCount,
            label: 'รอแก้ไข',
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
          { id: 'all', label: 'ทั้งหมด', count: mergedSubmissions.length },
          { id: 'submitted', label: 'ยื่นแล้ว / รอตรวจ', count: waitingCount },
          { id: 'reviewing', label: 'กำลังตรวจ', count: reviewingCount },
          { id: 'revision', label: 'รอแก้ไข', count: revisionCount },
          { id: 'approved', label: 'อนุมัติแล้ว', count: approvedCount },
        ]}
        activeTab={activeQueueTab}
        onTabChange={(tabId) => setActiveQueueTab(tabId as any)}
        eyebrow={isReviewTabVisible ? 'คิวพิจารณาจริยธรรม' : 'รายการยื่นของฉัน'}
        title={isReviewTabVisible ? 'ติดตามและพิจารณาคำขอรับการพิจารณาจริยธรรม' : 'ติดตามสถานะคำขอรับการพิจารณาจริยธรรม'}
        columns={columns}
        data={visibleSubmissions}
        getRowKey={(sub) => sub.id}
        empty={{
          icon: <Clipboard className="w-10 h-10 stroke-[1.5]" />,
          title: 'ยังไม่มีรายการในหมวดนี้',
          body: 'เมื่อมีคำขอที่ตรงเงื่อนไข รายการจะปรากฏที่นี่',
          dashed: true,
        }}
      />

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

      {/* MODAL: VIEW REVIEWER NOTES */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#64748B]">ความเห็นผู้ทรงคุณวุฒิ</p>
            <DialogTitle className="header-display text-lg font-black text-[#0F172A]">
              {selectedSubForNotes?.project_title}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
            <p className="text-xs font-semibold italic text-[#334155] whitespace-pre-wrap leading-relaxed">
              {selectedSubForNotes?.reviewer_notes ? selectedSubForNotes.reviewer_notes.replace(/\[.*?\]/g, '').trim() : '—'}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: EXPERT EVALUATION SCORECARD (STEPPER WIZARD) */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#00796B]">พิจารณาข้อเสนอ</p>
            <DialogTitle className="header-display text-base font-black text-[#0F172A]">
              ประเมินจริยธรรมโครงร่างวิจัย
            </DialogTitle>
          </DialogHeader>

          {selectedSubForReview && (
            <>
              {/* STEPPER PROGRESS INDICATOR */}
              <div className="px-6 py-4 bg-[#FAFDFD] border-b border-[#E2E8F0]">
                <div className="flex items-center justify-between relative max-w-sm mx-auto">
                  {/* Connecting line */}
                  <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E2E8F0] -z-0" />
                  <div
                    className="absolute top-4 left-6 h-0.5 bg-[#00796B] transition-all duration-300 -z-0"
                    style={{ width: reviewStep === 1 ? '0%' : reviewStep === 2 ? '50%' : '100%' }}
                  />

                  {[
                    { step: 1, label: 'เกณฑ์จริยธรรม' },
                    { step: 2, label: 'ความเสี่ยง & รายงาน' },
                    { step: 3, label: 'สรุปผล & บันทึก' }
                  ].map((s) => {
                    const isActive = reviewStep === s.step
                    const isDone = reviewStep > s.step
                    return (
                      <div key={s.step} className="flex flex-col items-center relative z-10">
                        <button
                          type="button"
                          onClick={() => setReviewStep(s.step)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#00796B] text-white ring-4 ring-[#00796B]/20 scale-110 shadow-md'
                              : isDone
                              ? 'bg-[#00796B] text-white'
                              : 'bg-white text-slate-400 border border-slate-300'
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : s.step}
                        </button>
                        <span
                          className={`text-[10px] font-extrabold mt-1.5 transition-colors whitespace-nowrap ${
                            isActive ? 'text-[#00796B]' : isDone ? 'text-[#00796B]' : 'text-slate-400'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* STEP CONTENT CONTAINER */}
              <div className="px-6 py-5 overflow-y-auto max-h-[58vh] space-y-4">
                {/* PROJECT TITLE HEADER & ATTACHMENTS LIST */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div>
                    <div className="text-[10px] font-mono font-extrabold text-[#64748B] uppercase tracking-wider">ชื่อโครงร่างวิจัย</div>
                    <div className="text-xs font-extrabold mt-0.5 text-[#0F172A]">
                      {selectedSubForReview.project_title}
                    </div>
                  </div>

                  {/* ATTACHED DOCUMENTS LIST FOR REVIEWER */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <div className="text-[10px] font-mono font-extrabold text-[#00796B] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>เอกสารแนบประกอบโครงร่างวิจัย ({attachments.filter((a) => a.submission_id === selectedSubForReview.id).length} ไฟล์)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {attachments.filter((a) => a.submission_id === selectedSubForReview.id).length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">ไม่มีเอกสารแนบจากผู้ยื่น</span>
                      ) : (
                        attachments.filter((a) => a.submission_id === selectedSubForReview.id).map((at) => (
                          <button
                            key={at.id}
                            type="button"
                            onClick={() => handleDownloadFile(at.file_url)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white border border-teal-200 text-[#00796B] hover:bg-teal-50 transition cursor-pointer shadow-2xs"
                            title={at.file_name}
                          >
                            <Download className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{at.file_name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* STEP 1: ETHICAL CRITERIA ASSESSMENT */}
                {reviewStep === 1 && (
                  <div className="space-y-3 animate-fadeIn">
                    <label className="block text-xs font-black text-[#0F172A]">ขั้นตอนที่ 1: ประเมินผลตามรายเกณฑ์ (6 เกณฑ์)</label>
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
                            <div className="grid grid-cols-3 gap-1.5 bg-white p-1.5 rounded-xl border border-[#E2E8F0]">
                              {[
                                {
                                  val: 'pass',
                                  label: 'ผ่าน',
                                  active: 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs',
                                  inactive: 'bg-white text-[#16A34A] border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                                },
                                {
                                  val: 'fail',
                                  label: 'ต้องแก้ไข',
                                  active: 'bg-[#D97706] text-white border-[#D97706] shadow-xs',
                                  inactive: 'bg-white text-[#D97706] border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                                },
                                {
                                  val: 'na',
                                  label: 'N/A',
                                  active: 'bg-[#64748B] text-white border-[#64748B] shadow-xs',
                                  inactive: 'bg-white text-[#64748B] border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                }
                              ].map((opt) => {
                                const isSelected = scores[criterion.key] === opt.val
                                return (
                                  <label key={opt.val} className="cursor-pointer text-[10px] font-black text-center">
                                    <input
                                      type="radio"
                                      name={`expert-score-${criterion.key}`}
                                      value={opt.val}
                                      checked={isSelected}
                                      onChange={() => setScores((prev) => ({ ...prev, [criterion.key]: opt.val as any }))}
                                      className="sr-only"
                                    />
                                    <div className={`py-1.5 rounded-lg border transition-all duration-150 font-extrabold ${isSelected ? opt.active : opt.inactive}`}>
                                      {opt.label}
                                    </div>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                )}

                {/* STEP 2: RISK LEVEL & PROGRESS REPORT INTERVAL */}
                {reviewStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-black text-[#0F172A] mb-1.5">ขั้นตอนที่ 2: เลือกระดับความเสี่ยงของโครงการวิจัย *</label>
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                        {RISK_LEVEL_OPTIONS.map((opt) => (
                          <label key={opt.value} className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${riskLevel === opt.value ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                            <input
                              type="radio"
                              name="risk-level-option"
                              value={opt.value}
                              checked={riskLevel === opt.value}
                              onChange={(e) => setRiskLevel(e.target.value)}
                              className="mt-0.5 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-xs font-bold text-slate-800 leading-snug">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#0F172A] mb-1.5">รอบการรายงานความก้าวหน้าโครงการ *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {REPORT_INTERVAL_OPTIONS.map((opt) => (
                          <label key={opt.value} className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer font-extrabold text-xs transition ${progressReportInterval === opt.value ? 'bg-teal-50 text-teal-700 border-teal-300 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                            <input
                              type="radio"
                              name="progress-report-interval"
                              value={opt.value}
                              checked={progressReportInterval === opt.value}
                              onChange={(e) => setProgressReportInterval(e.target.value)}
                              className="sr-only"
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: FINAL STATUS & COMMENTS */}
                {reviewStep === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <label className="block text-xs font-black text-[#0F172A]">ขั้นตอนที่ 3: สรุปผลการประเมินและข้อเสนอแนะ</label>

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
                      <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">สถานะผลประเมิน *</label>
                      <Select
                        value={reviewStatus}
                        onValueChange={(v) => setReviewStatus(v ?? 'อนุมัติ')}
                        items={[
                          { value: 'อนุมัติ', label: 'เห็นชอบ' },
                          { value: 'รอแก้ไข', label: 'เห็นชอบ หากแก้ไขตามข้อเสนอแนะ/ หากมีคำชี้แจงที่สมเหตุสมผล' },
                          { value: 'ไม่อนุมัติ', label: 'ไม่เห็นชอบ' },
                        ]}
                      >
                        <SelectTrigger className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl">
                          <SelectItem value="อนุมัติ">เห็นชอบ</SelectItem>
                          <SelectItem value="รอแก้ไข">เห็นชอบ หากแก้ไขตามข้อเสนอแนะ/ หากมีคำชี้แจงที่สมเหตุสมผล</SelectItem>
                          <SelectItem value="ไม่อนุมัติ">ไม่เห็นชอบ</SelectItem>
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

                    <div>
                      <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">
                        แนบเอกสารผลประเมิน / ใบรับรองเพิ่มเติม <span className="font-normal text-[#64748B]">(ถ้ามี)</span>
                      </label>
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.png,.jpg"
                        onChange={(e) => setReviewFiles(e.target.files)}
                        className={inputBase + ' h-auto'}
                        style={inputSty}
                      />
                      <p className="text-[10px] mt-1 text-[#64748B] font-semibold">รองรับไฟล์ PDF, Word, รูปภาพ สำหรับแนบหนังสือแจ้งผลการประเมินหรือแบบฟอร์มลงนาม</p>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP NAVIGATION FOOTER */}
              <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewStep((s) => Math.max(1, s - 1))}
                  disabled={reviewStep === 1}
                  className="rounded-full text-xs font-bold gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  ย้อนกลับ
                </Button>

                {reviewStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setReviewStep((s) => Math.min(3, s + 1))}
                    className="btn-primary rounded-full text-xs font-extrabold gap-1"
                  >
                    ถัดไป
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      const taggedNotes = `[${reviewerRoleLabel}]\n${reviewNotes}`
                      const serialized = serializeReviewerNotes(scores, taggedNotes, riskLevel, progressReportInterval)
                      handleSaveReview(selectedSubForReview.id, reviewStatus, serialized)
                      setReviewModalOpen(false)
                    }}
                    className="btn-primary rounded-full text-xs font-extrabold gap-1"
                  >
                    <Check className="w-4 h-4" />
                    บันทึกผลการประเมิน
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: ASSIGN REVIEWER */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl">
          <DialogHeader className="pb-3 border-b border-[#E2E8F0]">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#7C3AED]">
              มอบหมายงานวิจัย
            </p>
            <DialogTitle className="header-display text-base font-black text-[#0F172A]">
              มอบหมายผู้ทรงคุณวุฒิ (Expert Reviewer)
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            {selectedSubForAssign && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B]">ชื่อโครงร่างวิจัย</label>
                  <p className="font-extrabold text-[#0F172A] mt-0.5 text-xs">{selectedSubForAssign.project_title}</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F172A] mb-1.5">ผู้ทรงคุณวุฒิท่านที่ 1</label>
                  {(() => {
                    const selectedProfile = expertProfiles.find((p) => p.id === assignReviewerId)
                    const displayName = selectedProfile ? (selectedProfile.full_name || selectedProfile.email) : ''
                    const labelText = selectedProfile
                      ? `${displayName} (${formatUserRolesText(selectedProfile.role)}${(selectedProfile as any).is_temp_account ? ' · บัญชีชั่วคราว' : ''})`
                      : assignReviewerId === 'unassigned' || !assignReviewerId
                      ? '— ยังไม่ได้มอบหมาย —'
                      : assignReviewerId

                    return (
                      <Select
                        value={assignReviewerId || 'unassigned'}
                        onValueChange={(val) => setAssignReviewerId(val === 'unassigned' ? '' : val ?? '')}
                      >
                        <SelectTrigger className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-2xl">
                          <SelectValue placeholder="เลือกผู้ทรงคุณวุฒิ...">
                            {labelText}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl text-xs">
                          <SelectItem value="unassigned">— ยังไม่ได้มอบหมาย —</SelectItem>
                          {expertProfiles.map((p) => {
                            const nameText = p.full_name ? `${p.full_name} (${p.email})` : p.email
                            return (
                              <SelectItem key={p.id} value={p.id}>
                                {nameText} ({formatUserRolesText(p.role)}{(p as any).is_temp_account ? ' · บัญชีชั่วคราว' : ''})
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    )
                  })()}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F172A] mb-1.5">ผู้ทรงคุณวุฒิท่านที่ 2 (ถ้ามี)</label>
                  {(() => {
                    const selectedProfile2 = expertProfiles.find((p) => p.id === assignReviewerId2)
                    const displayName2 = selectedProfile2 ? (selectedProfile2.full_name || selectedProfile2.email) : ''
                    const labelText2 = selectedProfile2
                      ? `${displayName2} (${formatUserRolesText(selectedProfile2.role)}${(selectedProfile2 as any).is_temp_account ? ' · บัญชีชั่วคราว' : ''})`
                      : assignReviewerId2 === 'unassigned' || !assignReviewerId2
                      ? '— ยังไม่ได้มอบหมาย —'
                      : assignReviewerId2

                    return (
                      <Select
                        value={assignReviewerId2 || 'unassigned'}
                        onValueChange={(val) => setAssignReviewerId2(val === 'unassigned' ? '' : val ?? '')}
                      >
                        <SelectTrigger className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-2xl">
                          <SelectValue placeholder="เลือกผู้ทรงคุณวุฒิ...">
                            {labelText2}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl text-xs">
                          <SelectItem value="unassigned">— ยังไม่ได้มอบหมาย —</SelectItem>
                          {expertProfiles.map((p) => {
                            const nameText = p.full_name ? `${p.full_name} (${p.email})` : p.email
                            return (
                              <SelectItem key={p.id} value={p.id}>
                                {nameText} ({formatUserRolesText(p.role)}{(p as any).is_temp_account ? ' · บัญชีชั่วคราว' : ''})
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    )
                  })()}

                  <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between gap-2">
                    <span>ต้องการเพิ่มผู้ทรงคุณวุฒิชั่วคราวใหม่?</span>
                    <Link
                      href="/master/users"
                      className="text-[#0EA5A0] font-extrabold hover:underline shrink-0"
                    >
                      ไปที่หน้าจัดการผู้ใช้ →
                    </Link>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-[#E2E8F0]">
                  <Button
                    variant="outline"
                    onClick={() => setAssignModalOpen(false)}
                    className="rounded-full text-xs font-bold"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={async () => {
                      await handleAssignReviewer(selectedSubForAssign.id, assignReviewerId || null, assignReviewerId2 || null)
                      setAssignModalOpen(false)
                    }}
                    className="btn-primary rounded-full text-xs font-extrabold"
                  >
                    บันทึกการมอบหมาย
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: TEMP EXPERT CREDENTIAL RESULT */}
      {tempCredentialResult && (
        <Dialog open onOpenChange={() => setTempCredentialResult(null)}>
          <DialogContent className="max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-2xl space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-black text-[#0F172A] flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm">🔑</span>
                สร้างบัญชีผู้ทรงคุณวุฒิชั่วคราวสำเร็จ
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs text-[#334155] bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="font-extrabold text-slate-800">ส่งข้อมูลบัญชีและลิงก์นี้ให้ผู้ทรงคุณวุฒิเพื่อประเมินโครงการ:</p>
              
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-sans">อีเมล:</span>
                  <span className="font-bold text-[#0F172A]">{tempCredentialResult.email}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-sans">รหัสผ่านชั่วคราว:</span>
                  <span className="font-bold text-[#00796B] text-sm">{tempCredentialResult.password}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                  <span className="text-slate-500 font-sans">ลิงก์เข้าสู่ระบบตรง:</span>
                  <a
                    href={tempCredentialResult.loginUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0EA5A0] font-bold underline break-all"
                  >
                    {tempCredentialResult.loginUrl}
                  </a>
                </div>
              </div>

              <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                ⏳ หมดอายุในวันที่: <strong>{new Date(tempCredentialResult.expiresAt).toLocaleString('th-TH')}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => {
                  const textToCopy = `เรียน ผู้ทรงคุณวุฒิ\n\nท่านได้รับการมอบหมายให้พิจารณาจริยธรรมการวิจัย\nอีเมล: ${tempCredentialResult.email}\nรหัสผ่านชั่วคราว: ${tempCredentialResult.password}\nลิงก์เข้าสู่ระบบ: ${tempCredentialResult.loginUrl}\n(หมดอายุ: ${new Date(tempCredentialResult.expiresAt).toLocaleString('th-TH')})`
                  navigator.clipboard.writeText(textToCopy)
                  triggerAlert('คัดลอกสำเร็จ', 'คัดลอกข้อมูลบัญชีชั่วคราวเรียบร้อยแล้ว!', 'primary')
                }}
                className="btn-primary rounded-full text-xs font-bold px-5"
              >
                📋 คัดลอกข้อมูลทั้งหมด
              </Button>
              <Button
                variant="outline"
                onClick={() => setTempCredentialResult(null)}
                className="rounded-full text-xs font-bold"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
