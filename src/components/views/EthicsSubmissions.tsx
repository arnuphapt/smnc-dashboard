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
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  EVALUATION_CRITERIA,
  RISK_LEVEL_OPTIONS,
  REPORT_INTERVAL_OPTIONS,
  parseReviewerNotes,
  serializeReviewerNotes,
  handleExportEvaluation,
  deriveSubmissionStatus,
  translateEvaluationStatus
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
  uploaded_at?: string
}

interface EthicsEvaluation {
  id: string
  submission_id: string
  reviewer_id: string
  status: string
  reviewer_notes: string | null
  created_at: string
  updated_at: string
}

const inputBase = "w-full text-sm px-4 py-2.5 rounded-2xl focus:outline-none transition-all duration-200"
const inputSty = { border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A' }

const PENDING_STATUSES = ['ยื่นแล้ว', 'กำลังตรวจ']
const APPROVED_STATUSES = ['อนุมัติ', 'ไม่อนุมัติ']

const PdfIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <text x="5" y="16.5" fontSize="6.5" fontWeight="900" fill="currentColor" stroke="none" fontFamily="sans-serif">PDF</text>
  </svg>
)

import { useQueryClient } from '@tanstack/react-query'
import { useEthicsAttachments, useEthicsSubmissions } from '@/hooks/queries/useEthics'

export const EthicsSubmissions: React.FC = () => {

  const { user, profile, isPageAllowed } = useAuth()
  const { getOptionsByCategory } = useMasters()
  const queryClient = useQueryClient()

  const { data: submissions = [] } = useEthicsSubmissions(user?.id)
  const { data: attachments = [] } = useEthicsAttachments()
  const [reviewSubmissions, setReviewSubmissions] = useState<any[]>([])
  const [expertProfiles, setExpertProfiles] = useState<Profile[]>([])
  // Full per-submission evaluations list (not just a count) so the list row can
  // render each reviewer's individual status, not only "X/Y ประเมินแล้ว".
  const [evaluationsBySubmission, setEvaluationsBySubmission] = useState<Record<string, EthicsEvaluation[]>>({})

  const [activeQueueTab, setActiveQueueTab] = useState<'all' | 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'sent_back'>('all')

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
  const [notesModalEvaluations, setNotesModalEvaluations] = useState<EthicsEvaluation[]>([])

  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false)
  const [selectedSubForAttachments, setSelectedSubForAttachments] = useState<EthicsSubmission | null>(null)

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
  const [revisionDetails, setRevisionDetails] = useState<Record<string, string>>({
    obj: '',
    method: '',
    privacy: '',
    consent: '',
    risk: '',
    benefit: '',
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
      queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
      triggerAlert('สำเร็จ', 'มอบหมายผู้ทรงคุณวุฒิเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', err.message, 'danger')
    }
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

  const fetchExpertProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      const experts = ((data as Profile[]) || []).filter((p) => hasRole(p.role, 'expert'))
      setExpertProfiles(experts)
    } catch (err) { console.error(err) }
  }

  // Fetch per-submission evaluations for the "X/2 ประเมินแล้ว" badge AND the
  // per-reviewer status lines — one batched query instead of N+1 per-row queries.
  const fetchEvaluationCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('ethics_evaluations')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      const bySubmission: Record<string, EthicsEvaluation[]> = {}
      ;(data || []).forEach((row: EthicsEvaluation) => {
        if (!bySubmission[row.submission_id]) bySubmission[row.submission_id] = []
        bySubmission[row.submission_id].push(row)
      })
      setEvaluationsBySubmission(bySubmission)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (hasRole(profile?.role, 'admin')) {
      fetch('/api/admin/cleanup-temp-experts', { method: 'POST' }).catch(() => {})
    }
    fetchReviewSubmissions()
    fetchExpertProfiles()
    fetchEvaluationCounts()
  }, [user, profile])

  useEffect(() => {
    if (!user) return
    const s = supabase.channel('ethics-list-sub-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_submissions' }, () => {
      queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
      fetchReviewSubmissions()
    }).subscribe()
    const a = supabase.channel('ethics-list-att-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_attachments' }, () => {
      queryClient.invalidateQueries({ queryKey: ['ethics_attachments'] })
    }).subscribe()
    const e = supabase.channel('ethics-list-eval-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_evaluations' }, () => {
      fetchEvaluationCounts()
    }).subscribe()
    return () => { supabase.removeChannel(s); supabase.removeChannel(a); supabase.removeChannel(e) }
  }, [user, profile, queryClient])

  const handleDownloadFile = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('wisdom-private').createSignedUrl(path, 60)
      if (error) throw error
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    } catch (err: any) { triggerAlert('ไม่สามารถเปิดไฟล์แนบได้', err.message, 'danger') }
  }

  const handleSaveReview = async (subId: string, status: string, notes: string) => {
    if (!user?.id) {
      triggerAlert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่', 'danger')
      return
    }
    try {
      // Upsert into ethics_evaluations so each reviewer's evaluation is isolated
      // (was previously overwriting the shared ethics_submissions.reviewer_notes
      // column, causing the 2nd reviewer's save to erase the 1st's).
      // reviewer_id comes from the authenticated user (user.id), NOT the
      // "ประเมินในนาม" dropdown (reviewerRoleLabel) — that value is unauthenticated
      // free text and cannot be trusted as identity. reviewerRoleLabel is now
      // cosmetic only and no longer drives persistence.
      const { error: evalError } = await supabase
        .from('ethics_evaluations')
        .upsert(
          { submission_id: subId, reviewer_id: user.id, status, reviewer_notes: notes },
          { onConflict: 'submission_id,reviewer_id' }
        )
      if (evalError) throw evalError

      // Recompute ethics_submissions.status from the full set of that submission's
      // evaluations (not last-write-wins) — fetch fresh right after the upsert so
      // the just-written row is included, then derive via the shared pure function.
      const { data: freshEvaluations, error: fetchEvalError } = await supabase
        .from('ethics_evaluations')
        .select('*')
        .eq('submission_id', subId)
      if (fetchEvalError) throw fetchEvalError

      const assignedCount = [selectedSubForReview?.assigned_reviewer_id, selectedSubForReview?.assigned_reviewer_id_2]
        .filter(Boolean).length
      const derivedStatus = deriveSubmissionStatus(freshEvaluations || [], assignedCount)

      const { error } = await supabase.from('ethics_submissions').update({ status: derivedStatus }).eq('id', subId)
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
      queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
      queryClient.invalidateQueries({ queryKey: ['ethics_attachments'] })
      triggerAlert('บันทึกสำเร็จ', 'บันทึกผลการพิจารณาและอัปโหลดเอกสารเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) { triggerAlert('เกิดข้อผิดพลาด', err.message, 'danger') }
  }

  // Sends a fully-evaluated submission (2/2 done, any outcome) back to the
  // submitter for revision: preserves evaluation rows so submitters and admins
  // can view comments and instructions, and sets status to "ส่งกลับแก้ไข".
  const handleSendBackForRevision = async (subId: string) => {
    try {
      const { error: statusError } = await supabase
        .from('ethics_submissions')
        .update({ status: 'ส่งกลับแก้ไข' })
        .eq('id', subId)
      if (statusError) throw statusError

      fetchReviewSubmissions()
      fetchEvaluationCounts()
      queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
      triggerAlert('สำเร็จ', 'ส่งกลับให้ผู้ยื่นแก้ไขเรียบร้อยแล้ว', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', err.message, 'danger')
    }
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
      queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
      queryClient.invalidateQueries({ queryKey: ['ethics_attachments'] })
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถลบคำขอได้: ${err.message}`, 'danger')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Load ALL evaluations (one row per assigned reviewer) for the "ความเห็นผู้ทรงคุณวุฒิ"
  // modal — mirrors the same ethics_evaluations query/order used by handleExportClick
  // below so both surfaces show the same set of reviewer comments consistently.
  const handleOpenNotesModal = async (sub: EthicsSubmission) => {
    setSelectedSubForNotes(sub)
    setNotesModalEvaluations([])
    setNotesModalOpen(true)
    try {
      const { data: evalData, error: evalError } = await supabase
        .from('ethics_evaluations')
        .select('*')
        .eq('submission_id', sub.id)
        .order('created_at', { ascending: true })
      if (evalError) throw evalError
      setNotesModalEvaluations((evalData || []) as EthicsEvaluation[])
    } catch (err) { console.error(err) }
  }

  const handleExportClick = async (sub: any) => {
    // Fetch fresh data from DB to always show latest evaluation
    let freshSub = sub
    let submitterName = sub.profiles?.full_name || sub.profiles?.email || user?.email || ''
    try {
      const { data: freshData } = await supabase
        .from('ethics_submissions')
        .select('*, profiles:submitter_id(email, full_name)')
        .eq('id', sub.id)
        .single()
      if (freshData) {
        freshSub = freshData
        submitterName = (freshData.profiles as any)?.full_name || (freshData.profiles as any)?.email || submitterName
      }
    } catch (err) { console.error(err) }

    let evaluations: EthicsEvaluation[] = []
    try {
      const { data: evalData, error: evalError } = await supabase
        .from('ethics_evaluations')
        .select('*')
        .eq('submission_id', sub.id)
        .order('created_at', { ascending: true })
      if (evalError) throw evalError
      evaluations = (evalData || []) as EthicsEvaluation[]
    } catch (err) { console.error(err) }

    handleExportEvaluation(freshSub, submitterName, evaluations)
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
      const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
      for (let i = 0; i < revisionFiles.length; i++) {
        const file = revisionFiles[i]
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`ไฟล์ "${file.name}" มีขนาดใหญ่เกินกำหนด (${(file.size / (1024 * 1024)).toFixed(1)} MB) ขนาดสูงสุดที่รองรับคือ 50 MB ต่อไฟล์`)
        }
      }

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
        queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
        queryClient.invalidateQueries({ queryKey: ['ethics_attachments'] })
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
  const approvedCount = mergedSubmissions.filter(s => s.status === 'อนุมัติ').length
  const rejectedCount = mergedSubmissions.filter(s => s.status === 'ไม่อนุมัติ').length
  const sentBackCount = mergedSubmissions.filter(s => s.status === 'ส่งกลับแก้ไข').length

  const visibleSubmissions = mergedSubmissions.filter((s) => {
    if (activeQueueTab === 'submitted') return s.status === 'ยื่นแล้ว'
    if (activeQueueTab === 'reviewing') return s.status === 'กำลังตรวจ'
    if (activeQueueTab === 'approved') return s.status === 'อนุมัติ'
    if (activeQueueTab === 'rejected') return s.status === 'ไม่อนุมัติ'
    if (activeQueueTab === 'sent_back') return s.status === 'ส่งกลับแก้ไข'
    return true
  })

  const openReviewModalFor = (sub: any) => {
    setSelectedSubForReview(sub)
    setReviewStep(1)
    setReviewFiles(null)
    const validStatuses = ['อนุมัติ', 'ไม่อนุมัติ', 'ส่งกลับแก้ไข']
    // Seed from the CURRENT USER's own prior evaluation (not the submission's
    // derived status) — otherwise a 2nd reviewer opening the modal would see the
    // 1st reviewer's already-derived-or-stale value instead of their own answer.
    const ownEvaluation = (evaluationsBySubmission[sub.id] || []).find((ev) => ev.reviewer_id === user?.id)
    setReviewStatus(ownEvaluation && validStatuses.includes(ownEvaluation.status) ? ownEvaluation.status : 'อนุมัติ')
    const parsed = parseReviewerNotes(ownEvaluation?.reviewer_notes || sub.reviewer_notes || '')
    setScores(parsed.scores)
    setRevisionDetails(parsed.revisionDetails || { obj: '', method: '', privacy: '', consent: '', risk: '', benefit: '' })
    setRiskLevel(parsed.riskLevel)
    setProgressReportInterval(parsed.progressReportInterval)

    let cleanComments = parsed.comments
    cleanComments = cleanComments
      .replace(/\[.*?\]/g, '')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      .trim()
    setReviewerRoleLabel('คณะกรรมการประเมิน')
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

  const canAssign = hasRole(profile?.role, 'admin') || hasRole(profile?.role, 'assistant_admin')

  const columns: DataTableColumn<EthicsSubmission>[] = [
    {
      key: 'project_title',
      header: 'ชื่อโครงร่างวิจัย',
      className: 'min-w-[420px] max-w-[650px]',
      render: (sub) => (
        <div className="min-w-[380px] space-y-1 py-1">
          <div className="text-xs font-extrabold text-[#0F172A] leading-relaxed break-words">{sub.project_title}</div>
          {sub.project_description && <p className="text-[11px] font-medium text-[#64748B] leading-normal line-clamp-3">{sub.project_description}</p>}
        </div>
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
    ...(canAssign ? [{
      key: 'assigned_reviewer',
      header: 'ผู้ทรงคุณวุฒิที่มอบหมาย',
      render: (sub: EthicsSubmission) => {
        const assignedUser = expertProfiles.find((p) => p.id === sub.assigned_reviewer_id)
        const assignedUser2 = expertProfiles.find((p) => p.id === sub.assigned_reviewer_id_2)
        if (!assignedUser && !assignedUser2) {
          return <span className="text-xs font-semibold text-[#64748B] whitespace-nowrap">ยังไม่ได้มอบหมาย</span>
        }
        const reviewerNames = [assignedUser?.full_name || assignedUser?.email, assignedUser2?.full_name || assignedUser2?.email].filter(Boolean)
        return (
          <div className="flex flex-col gap-0.5">
            {reviewerNames.map((name, idx) => (
              <span key={idx} className="text-xs font-semibold text-[#64748B] whitespace-nowrap">
                {idx + 1}. {name}
              </span>
            ))}
          </div>
        )
      },
    } as DataTableColumn<EthicsSubmission>] : []),

    {
      key: 'status',
      header: 'สถานะ',
      render: (sub) => {
        const assignedCount = [sub.assigned_reviewer_id, sub.assigned_reviewer_id_2].filter(Boolean).length
        const subEvaluations = evaluationsBySubmission[sub.id] || []
        const evaluatedCount = subEvaluations.length
        const slotCount = Math.max(assignedCount, evaluatedCount)
        return (
          <div className="flex flex-col gap-1 items-start">
            <StatusBadge status={sub.status} size="sm" />
            {isReviewTabVisible && assignedCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap bg-slate-100 text-slate-600 border border-slate-200">
                {evaluatedCount}/{assignedCount} ประเมินแล้ว
              </span>
            )}
            {isReviewTabVisible && slotCount > 0 && (
              <div className="flex flex-col gap-0.5">
                {Array.from({ length: slotCount }).map((_, idx) => {
                  const ev = subEvaluations[idx]
                  return (
                    <span key={idx} className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                      ผู้ประเมินที่ {idx + 1}: {ev ? translateEvaluationStatus(ev.status) : 'ยังไม่ได้ประเมิน'}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'reviewer_notes',
      header: 'ความเห็นผู้ทรงคุณวุฒิ',
      align: 'center',
      render: (sub) => {
        const hasEvaluations = (evaluationsBySubmission[sub.id] && evaluationsBySubmission[sub.id].length > 0)
        const hasNotes = Boolean(sub.reviewer_notes || hasEvaluations)
        return hasNotes ? (
          <button
            onClick={() => handleOpenNotesModal(sub)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold text-[#00796B] bg-[#F0F7FF] border border-[#DAEEFF] hover:bg-[#E0F2FE] transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            title="ดูความเห็นผู้ทรงคุณวุฒิ"
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            ดูความคิดเห็น
          </button>
        ) : (
          <span className="text-xs text-[#94A3B8]">—</span>
        )
      },
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

        const actionButtons: {
          key: string
          label: string
          icon: React.ReactNode
          onClick: () => void
          fullClass: string
          iconClass: string
          isPdfIcon?: boolean
        }[] = []

        if (canAssign) {
          actionButtons.push({
            key: 'assign',
            label: 'มอบหมายผู้ทรงคุณวุฒิ',
            icon: <UserCheck className="w-4 h-4" />,
            onClick: () => {
              setSelectedSubForAssign(sub)
              setAssignReviewerId(sub.assigned_reviewer_id || '')
              setAssignReviewerId2(sub.assigned_reviewer_id_2 || '')
              setAssignModalOpen(true)
            },
            fullClass: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white transition cursor-pointer shadow-xs whitespace-nowrap',
            iconClass: 'inline-flex items-center justify-center w-8 h-8 rounded-full text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-600 hover:text-white transition cursor-pointer shadow-xs shrink-0',
          })
        }

        if (subAttach.length > 0) {
          actionButtons.push({
            key: 'attachments',
            label: `เอกสารแนบ (${subAttach.length} ไฟล์)`,
            icon: <PdfIcon className="w-4 h-4 text-red-600 shrink-0" />,
            onClick: () => {
              setSelectedSubForAttachments(sub)
              setAttachmentsModalOpen(true)
            },
            fullClass: 'inline-flex items-center justify-center w-8 h-8 rounded-full text-red-600 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white transition-colors cursor-pointer shadow-xs shrink-0',
            iconClass: 'inline-flex items-center justify-center w-8 h-8 rounded-full text-red-600 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white transition-colors cursor-pointer shadow-xs shrink-0',
            isPdfIcon: true,
          })
        }

        if (isReviewTabVisible) {
          actionButtons.push({
            key: 'review',
            label: 'พิจารณาผล',
            icon: <ClipboardCheck className="w-4 h-4" />,
            onClick: () => openReviewModalFor(sub),
            fullClass: 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[#00796B] text-white hover:bg-[#005F56] transition cursor-pointer shadow-xs whitespace-nowrap',
            iconClass: 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#00796B] text-white hover:bg-[#005F56] transition cursor-pointer shadow-xs shrink-0',
          })
        }

        // Export/print only allowed once every assigned reviewer has submitted
        // their evaluation (X/Y complete) — previously gated on `sub.reviewer_notes`
        // truthiness alone, which only meant "at least one reviewer wrote something."
        const exportAssignedCount = [sub.assigned_reviewer_id, sub.assigned_reviewer_id_2].filter(Boolean).length
        const exportEvaluatedCount = (evaluationsBySubmission[sub.id] || []).length
        if (exportAssignedCount > 0 && exportEvaluatedCount >= exportAssignedCount) {
          actionButtons.push({
            key: 'export',
            label: 'รายงานผล',
            icon: <ExternalLink className="w-4 h-4" />,
            onClick: () => handleExportClick(sub),
            fullClass: 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-[#DAEEFF] bg-[#F0F7FF] text-[#00796B] hover:bg-[#00796B] hover:text-white transition cursor-pointer shadow-xs whitespace-nowrap',
            iconClass: 'inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#DAEEFF] bg-[#F0F7FF] text-[#00796B] hover:bg-[#00796B] hover:text-white transition cursor-pointer shadow-xs shrink-0',
          })
        }

        // "ส่งกลับแก้ไข": once both assigned reviewers have evaluated (regardless
        // of outcome — อนุมัติ/ไม่อนุมัติ doesn't matter), admin/reviewers can send
        // the submission back to the submitter for revision. Same visibility rule
        // as "พิจารณาผล"/"รายงานผล" above (isReviewTabVisible), gated additionally
        // on the same 2/2-complete condition as the export button.
        if (isReviewTabVisible && exportAssignedCount > 0 && exportEvaluatedCount >= exportAssignedCount) {
          actionButtons.push({
            key: 'send_back',
            label: 'ส่งกลับแก้ไข',
            icon: <FileEdit className="w-4 h-4" />,
            onClick: () => handleSendBackForRevision(sub.id),
            fullClass: 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition cursor-pointer shadow-xs whitespace-nowrap',
            iconClass: 'inline-flex items-center justify-center w-8 h-8 rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition cursor-pointer shadow-xs shrink-0',
          })
        }

        // "ยื่นอีกรอบ": once the submission has been sent back for revision,
        // the submitter (owner) can reopen the existing revision-submit modal
        // (handleOpenRevisionModal/handleSubmitRevision) to upload a revised
        // document — reuses the pre-existing "ส่งเล่มโครงร่างวิจัยฉบับแก้ไข" flow
        // rather than building a parallel one.
        if (isOwner && sub.status === 'ส่งกลับแก้ไข') {
          actionButtons.push({
            key: 'resubmit',
            label: 'ยื่นอีกรอบ',
            icon: <UploadCloud className="w-4 h-4" />,
            onClick: () => handleOpenRevisionModal(sub),
            fullClass: 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[#00796B] text-white hover:bg-[#005F56] transition cursor-pointer shadow-xs whitespace-nowrap',
            iconClass: 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#00796B] text-white hover:bg-[#005F56] transition cursor-pointer shadow-xs shrink-0',
          })
        }

        if (isOwner) {
          actionButtons.push({
            key: 'delete',
            label: 'ลบคำขอ',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => handleDeleteSubmission(sub.id),
            fullClass: 'inline-flex items-center gap-1.5 text-xs font-extrabold !py-1.5 !px-3 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#DC2626] hover:text-white transition-all cursor-pointer shadow-xs whitespace-nowrap',
            iconClass: 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#DC2626] hover:text-white transition-all cursor-pointer shadow-xs shrink-0',
          })
        }

        const useIconOnly = actionButtons.length > 3

        return (
          <div className="flex items-center justify-center gap-1.5 flex-nowrap">
            {actionButtons.map((btn) => {
              if (useIconOnly || btn.isPdfIcon) {
                return (
                  <Tooltip key={btn.key}>
                    <TooltipTrigger
                      onClick={btn.onClick}
                      className={btn.iconClass}
                    >
                      {btn.icon}
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {btn.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return (
                <button
                  key={btn.key}
                  onClick={btn.onClick}
                  className={btn.fullClass}
                  title={btn.label}
                >
                  {btn.icon}
                  <span>{btn.label}</span>
                </button>
              )
            })}
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
          isPageAllowed('ethics_submit') ? (
            <Link
              href="/ethics"
              className="shrink-0 btn-primary text-xs flex items-center gap-2 !py-2.5 !px-5"
            >
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              ยื่นโครงร่างวิจัยใหม่
            </Link>
          ) : null
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
            key: 'approved',
            count: approvedCount,
            label: 'อนุมัติแล้ว',
            icon: <FileCheck className="w-5 h-5" />,
            iconBg: 'bg-[#E8F6F5]',
            iconColor: 'text-[#00796B]',
          },
          {
            key: 'rejected',
            count: rejectedCount,
            label: 'ไม่อนุมัติ',
            icon: <AlertCircle className="w-5 h-5" />,
            iconBg: 'bg-[#FEE2E2]',
            iconColor: 'text-[#DC2626]',
          },
          {
            key: 'sent_back',
            count: sentBackCount,
            label: 'ส่งกลับแก้ไข',
            icon: <FileEdit className="w-5 h-5" />,
            iconBg: 'bg-[#FEF3C7]',
            iconColor: 'text-[#B45309]',
          },
        ]}
        tabs={[
          { id: 'all', label: 'ทั้งหมด', count: mergedSubmissions.length },
          { id: 'submitted', label: 'ยื่นแล้ว / รอตรวจ', count: waitingCount },
          { id: 'reviewing', label: 'กำลังตรวจ', count: reviewingCount },
          { id: 'approved', label: 'อนุมัติแล้ว', count: approvedCount },
          { id: 'sent_back', label: 'ส่งกลับแก้ไข', count: sentBackCount },
          { id: 'rejected', label: 'ไม่อนุมัติ', count: rejectedCount },
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
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#64748B]">แก้ไขส่งปรับปรุง</p>
            <DialogTitle className="header-display text-base font-black text-[#0F172A]">
              ส่งเล่มโครงร่างวิจัยฉบับแก้ไข
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
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
                    <p className="text-[10px] mt-1 text-[#64748B] font-semibold">รองรับ PDF, Word เท่านั้น — ขนาดสูงสุดไม่เกิน 50 MB ต่อไฟล์</p>
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
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#64748B]">ความเห็นผู้ทรงคุณวุฒิ</p>
            <DialogTitle className="header-display text-sm font-black text-[#0F172A] line-clamp-2 leading-relaxed" title={selectedSubForNotes?.project_title}>
              {selectedSubForNotes?.project_title}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-4">
            {(() => {
              const cleanNotes = (notesText: string) => notesText
                .replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*?=== ความเห็นและข้อเสนอแนะเพิ่มเติม ===\s*\n*/, '')
                .replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*$/, '')
                .replace(/===\s*(?:ความเห็นและข้อเสนอแนะเพิ่มเติม|ข้อเสนอแนะเพิ่มเติม)\s*===\s*\n*/, '')
                .replace(/\[.*?\]/g, '')
                .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
                .trim()

              // Fall back to the legacy single-evaluator source (sub.reviewer_notes) when
              // no ethics_evaluations rows exist yet — same fallback as handleExportEvaluation.
              const evaluationSource = notesModalEvaluations.length > 0
                ? notesModalEvaluations
                : (selectedSubForNotes?.reviewer_notes ? [{ reviewer_notes: selectedSubForNotes.reviewer_notes } as EthicsEvaluation] : [])

              const assignedCount = selectedSubForNotes
                ? [selectedSubForNotes.assigned_reviewer_id, selectedSubForNotes.assigned_reviewer_id_2].filter(Boolean).length
                : 0
              const slotCount = Math.max(assignedCount, evaluationSource.length)

              if (slotCount === 0) {
                return <p className="text-xs font-semibold text-[#334155]">—</p>
              }

              return Array.from({ length: slotCount }).map((_, idx) => {
                const ev = evaluationSource[idx]
                if (!ev) {
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#00796B] mb-1">
                        ผู้ประเมินที่ {idx + 1}
                      </p>
                      <p className="text-xs font-semibold text-[#94A3B8]">
                        ผู้ประเมินที่ {idx + 1} ยังไม่ได้ประเมิน
                      </p>
                    </div>
                  )
                }

                const parsed = parseReviewerNotes(ev.reviewer_notes || '')
                const cleanComm = cleanNotes(parsed.comments)
                const riskLabel = RISK_LEVEL_OPTIONS.find(r => r.value === parsed.riskLevel)?.label || 'ไม่เกินความเสี่ยงเล็กน้อย'
                const intervalLabel = REPORT_INTERVAL_OPTIONS.find(i => i.value === parsed.progressReportInterval)?.label || 'ทุก 12 เดือน (1 ปี)'

                const criteriaItems = [
                  { label: '1. วัตถุประสงค์และการออกแบบการวิจัย', val: parsed.scores.obj, rev: parsed.revisionDetails?.obj },
                  { label: '2. ความเหมาะสมของระเบียบวิธีวิจัยและกลุ่มตัวอย่าง', val: parsed.scores.method, rev: parsed.revisionDetails?.method },
                  { label: '3. การปกป้องสิทธิ์ ความเป็นส่วนตัว และข้อมูลส่วนบุคคล', val: parsed.scores.privacy, rev: parsed.revisionDetails?.privacy },
                  { label: '4. ความสมบูรณ์ของแบบชี้แจงและใบยินยอม (Informed Consent)', val: parsed.scores.consent, rev: parsed.revisionDetails?.consent },
                  { label: '5. มาตรการป้องกันและลดความเสี่ยงต่ออาสาสมัคร', val: parsed.scores.risk, rev: parsed.revisionDetails?.risk },
                  { label: '6. สัดส่วนประโยชน์ที่ได้รับเทียบกับความเสี่ยงมีความเหมาะสม', val: parsed.scores.benefit, rev: parsed.revisionDetails?.benefit },
                ]

                return (
                  <div key={idx} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <p className="text-xs font-mono font-black uppercase tracking-wider text-[#00796B]">
                        ผู้ประเมินที่ {idx + 1}
                      </p>
                      {ev.status && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          ev.status === 'อนุมัติ' ? 'bg-green-100 text-green-700 border border-green-200' :
                          ev.status === 'ส่งกลับแก้ไข' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {translateEvaluationStatus(ev.status)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="font-extrabold text-slate-500">ระดับความเสี่ยง: </span>
                        <span className="font-bold text-slate-800">{riskLabel}</span>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-500">รอบรายงาน: </span>
                        <span className="font-bold text-slate-800">{intervalLabel}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[11px] font-extrabold text-slate-600">ผลการประเมินรายเกณฑ์:</p>
                      <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200">
                        {criteriaItems.map((c, cIdx) => (
                          <div key={cIdx} className="text-xs pb-1.5 border-b border-slate-100 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-700">{c.label}</span>
                              <span className={`font-bold shrink-0 text-[11px] ${
                                c.val === 'pass' ? 'text-green-600' : c.val === 'fail' ? 'text-amber-600' : 'text-slate-400'
                              }`}>
                                {c.val === 'pass' ? '✓ ผ่าน' : c.val === 'fail' ? '✗ แก้ไข' : '- N/A'}
                              </span>
                            </div>
                            {c.rev && (
                              <div className="mt-1 text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200/80 leading-relaxed font-medium">
                                <strong className="font-bold text-amber-900">ข้อเสนอแนะ:</strong> {c.rev}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {cleanComm && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-extrabold text-slate-600">ข้อเสนอแนะเพิ่มเติม:</p>
                        <div className="text-xs font-semibold text-[#334155] whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                          {cleanComm}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: VIEW ATTACHMENTS */}
      <Dialog open={attachmentsModalOpen} onOpenChange={setAttachmentsModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#64748B]">
              เอกสารแนบ {selectedSubForAttachments ? `(${attachments.filter((a) => a.submission_id === selectedSubForAttachments.id).length} ไฟล์)` : ''}
            </p>
            <DialogTitle className="header-display text-sm font-black text-[#0F172A] line-clamp-2 leading-relaxed" title={selectedSubForAttachments?.project_title}>
              {selectedSubForAttachments?.project_title}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-2">
            {(() => {
              const subAttach = selectedSubForAttachments
                ? attachments.filter((a) => a.submission_id === selectedSubForAttachments.id)
                : []
              if (subAttach.length === 0) {
                return <p className="text-xs font-semibold text-[#94A3B8]">ไม่มีเอกสารแนบ</p>
              }
              return subAttach.map((at) => (
                <button
                  key={at.id}
                  type="button"
                  onClick={() => handleDownloadFile(at.file_url)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer shadow-xs text-left"
                >
                  <PdfIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{at.file_name || 'เอกสาร PDF'}</span>
                </button>
              ))
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: EXPERT EVALUATION SCORECARD (STEPPER WIZARD) */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#00796B]">พิจารณาข้อเสนอ</p>
            <DialogTitle className="header-display text-base font-black text-[#0F172A]">
              ประเมินจริยธรรมโครงร่างวิจัย
            </DialogTitle>
          </DialogHeader>

          {selectedSubForReview && (
            <>
              {/* STEPPER PROGRESS INDICATOR */}
              <div className="px-6 py-4 bg-[#FAFDFD] border-b border-[#E2E8F0] shrink-0">
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
              <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-4">
                {/* PROJECT TITLE HEADER & ATTACHMENTS LIST */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div>
                    <div className="text-[10px] font-mono font-extrabold text-[#64748B] uppercase tracking-wider">ชื่อโครงร่างวิจัย</div>
                    <div className="text-xs font-extrabold mt-0.5 text-[#0F172A]">
                      {selectedSubForReview.project_title}
                    </div>
                  </div>

                  {/* PER-REVIEWER EVALUATION STATUS (anonymized by slot index, not by name) */}
                  {(() => {
                    const assignedCount = [selectedSubForReview.assigned_reviewer_id, selectedSubForReview.assigned_reviewer_id_2].filter(Boolean).length
                    const subEvaluations = evaluationsBySubmission[selectedSubForReview.id] || []
                    const slotCount = Math.max(assignedCount, subEvaluations.length)
                    if (slotCount === 0) return null
                    return (
                      <div className="pt-2 border-t border-slate-200/80">
                        <div className="text-[10px] font-mono font-extrabold text-[#00796B] uppercase tracking-wider mb-1">สถานะการประเมินของผู้ทรงคุณวุฒิ</div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {Array.from({ length: slotCount }).map((_, idx) => {
                            const ev = subEvaluations[idx]
                            const isSelf = ev?.reviewer_id === user?.id
                            return (
                              <span key={idx} className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                                ผู้ประเมินที่ {idx + 1}{isSelf ? ' (ตัวคุณ)' : ''}: {ev ? translateEvaluationStatus(ev.status) : 'ยังไม่ได้ประเมิน'}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

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
                        const STANDARD_KEYS = ['obj', 'method', 'privacy', 'consent', 'risk', 'benefit']
                        const criteriaOptions = getOptionsByCategory('ethics_criteria')
                        const activeCriteria = criteriaOptions.length > 0
                          ? criteriaOptions.map((opt, idx) => ({
                              key: STANDARD_KEYS[idx] || `opt_${opt.id}`,
                              label: opt.value.startsWith(`${idx + 1}.`) ? opt.value : `${idx + 1}. ${opt.value}`
                            }))
                          : EVALUATION_CRITERIA

                        return activeCriteria.map((criterion) => (
                          <div key={criterion.key} className="space-y-1.5 bg-white p-3 rounded-xl border border-[#E2E8F0]">
                            <div className="text-[11px] font-extrabold text-[#0F172A] leading-snug">{criterion.label}</div>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  val: 'pass',
                                  label: 'ผ่าน',
                                  active: 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs',
                                  inactive: 'bg-white text-[#16A34A] border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                                },
                                {
                                  val: 'fail',
                                  label: 'แก้ไข',
                                  active: 'bg-[#D97706] text-white border-[#D97706] shadow-xs',
                                  inactive: 'bg-white text-[#D97706] border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                                }
                              ].map((opt) => {
                                const isSelected = scores[criterion.key] === opt.val || (opt.val === 'fail' && scores[criterion.key] === 'na')
                                return (
                                  <label key={opt.val} className="cursor-pointer text-xs font-black text-center">
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

                            <div className="pt-1">
                              <label className="block text-[10px] font-extrabold text-slate-500 mb-1">รายละเอียดการแก้ไข</label>
                              <input
                                type="text"
                                placeholder="ระบุรายละเอียดการแก้ไขสำหรับข้อนี้ (ถ้ามี)..."
                                value={revisionDetails[criterion.key] || ''}
                                onChange={(e) => setRevisionDetails((prev) => ({ ...prev, [criterion.key]: e.target.value }))}
                                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
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
                      <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">สถานะผลประเมิน *</label>
                      <Select
                        value={reviewStatus}
                        onValueChange={(v) => setReviewStatus(v ?? 'อนุมัติ')}
                        items={[
                          { value: 'อนุมัติ', label: 'เห็นชอบ' },
                          { value: 'ไม่อนุมัติ', label: 'ไม่เห็นชอบ' },
                          { value: 'ส่งกลับแก้ไข', label: 'ส่งแก้ไข' },
                        ]}
                      >
                        <SelectTrigger className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl">
                          <SelectItem value="อนุมัติ">เห็นชอบ</SelectItem>
                          <SelectItem value="ไม่อนุมัติ">ไม่เห็นชอบ</SelectItem>
                          <SelectItem value="ส่งกลับแก้ไข">ส่งแก้ไข</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">ข้อเสนอแนะเพิ่มเติม</label>
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
                        เอกสารแนบอื่นๆ <span className="font-normal text-[#64748B]">(ถ้ามี)</span>
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
                      const taggedNotes = reviewNotes
                      const serialized = serializeReviewerNotes(scores, taggedNotes, riskLevel, progressReportInterval, revisionDetails)
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
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#7C3AED]">
              มอบหมายงานวิจัย
            </p>
            <DialogTitle className="header-display text-base font-black text-[#0F172A]">
              มอบหมายผู้ทรงคุณวุฒิ (Expert Reviewer)
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
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
