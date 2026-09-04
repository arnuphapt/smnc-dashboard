'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth, Profile } from '@/context/AuthContext'
import { useMasters } from '@/context/MasterContext'
import { hasRole } from '@/utils/roleHelper'
import { UploadCloud, Clock, CheckCircle, AlertCircle, FileEdit, FileCheck, Clipboard } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { DataTable } from '@/components/DataTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { handleExportEvaluation } from './masterdata/EthicsTab'
import { useQueryClient } from '@tanstack/react-query'
import { useEthicsAttachments, useEthicsSubmissions } from '@/hooks/queries/useEthics'
import { EthicsSubmission, EthicsEvaluation } from '@/types/ethics'
import { createEthicsTableColumns } from '@/components/ethics/EthicsTableColumns'
import { AdminDecisionDialog } from '@/components/ethics/dialogs/AdminDecisionDialog'
import { ReviewFormDialog } from '@/components/ethics/dialogs/ReviewFormDialog'
import { AssignReviewerDialog } from '@/components/ethics/dialogs/AssignReviewerDialog'
import { NotesDialog } from '@/components/ethics/dialogs/NotesDialog'
import { AttachmentsDialog } from '@/components/ethics/dialogs/AttachmentsDialog'
import { RevisionDialog } from '@/components/ethics/dialogs/RevisionDialog'
import { SendBackDialog } from '@/components/ethics/dialogs/SendBackDialog'

const supabase = createClient()

export const EthicsSubmissions: React.FC = () => {
  const { user, profile, isPageAllowed } = useAuth()
  const { getOptionsByCategory } = useMasters()
  const queryClient = useQueryClient()

  const { data: submissions = [] } = useEthicsSubmissions(user?.id)
  const { data: attachments = [] } = useEthicsAttachments()
  const [reviewSubmissions, setReviewSubmissions] = useState<any[]>([])
  const [expertProfiles, setExpertProfiles] = useState<Profile[]>([])
  const [evaluationsBySubmission, setEvaluationsBySubmission] = useState<Record<string, EthicsEvaluation[]>>({})

  const [activeQueueTab, setActiveQueueTab] = useState<
    'all' | 'submitted' | 'reviewing' | 'pending_approval' | 'approved' | 'rejected' | 'sent_back'
  >('all')

  // Dialog states
  const [adminDecisionModalOpen, setAdminDecisionModalOpen] = useState(false)
  const [selectedSubForAdminDecision, setSelectedSubForAdminDecision] = useState<EthicsSubmission | null>(null)

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedSubForReview, setSelectedSubForReview] = useState<EthicsSubmission | null>(null)

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedSubForAssign, setSelectedSubForAssign] = useState<EthicsSubmission | null>(null)

  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [selectedSubForNotes, setSelectedSubForNotes] = useState<EthicsSubmission | null>(null)
  const [notesModalEvaluations, setNotesModalEvaluations] = useState<EthicsEvaluation[]>([])

  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false)
  const [selectedSubForAttachments, setSelectedSubForAttachments] = useState<EthicsSubmission | null>(null)

  const [revisionModalOpen, setRevisionModalOpen] = useState(false)
  const [selectedSubForRevision, setSelectedSubForRevision] = useState<EthicsSubmission | null>(null)

  const [sendBackModalOpen, setSendBackModalOpen] = useState(false)
  const [selectedSubForSendBack, setSelectedSubForSendBack] = useState<EthicsSubmission | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [subIdToDelete, setSubIdToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string
    description: string
    variant?: 'primary' | 'danger' | 'warning'
  } | null>(null)

  const triggerAlert = (title: string, description: string, variant: 'primary' | 'danger' | 'warning' = 'primary') => {
    setAlertConfig({ title, description, variant })
    setAlertDialogOpen(true)
  }

  const fetchReviewSubmissions = async () => {
    if (!user) return
    try {
      let query = supabase
        .from('ethics_submissions')
        .select('*, profiles:submitter_id(email)')
        .order('created_at', { ascending: false })
      if (hasRole(profile?.role, 'expert') && !hasRole(profile?.role, 'admin')) {
        query = query.or(`assigned_reviewer_id.eq.${user.id},assigned_reviewer_id_2.eq.${user.id}`)
      }
      const { data, error } = await query
      if (error) throw error
      setReviewSubmissions(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchExpertProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      const experts = ((data as Profile[]) || []).filter((p) => hasRole(p.role, 'expert'))
      setExpertProfiles(experts)
    } catch (err) {
      console.error(err)
    }
  }

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
    } catch (err) {
      console.error(err)
    }
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
    const s = supabase
      .channel('ethics-list-sub-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_submissions' }, () => {
        fetchReviewSubmissions()
        queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
      })
      .subscribe()
    const a = supabase
      .channel('ethics-list-att-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_attachments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['ethics_attachments'] })
      })
      .subscribe()
    const e = supabase
      .channel('ethics-list-eval-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_evaluations' }, () => {
        fetchEvaluationCounts()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(s)
      supabase.removeChannel(a)
      supabase.removeChannel(e)
    }
  }, [user, profile, queryClient])

  const handleDownloadFile = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('wisdom-private').createSignedUrl(path, 60)
      if (error) throw error
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    } catch (err: any) {
      triggerAlert('ไม่สามารถเปิดไฟล์แนบได้', err.message, 'danger')
    }
  }

  const handleAssignReviewer = async (subId: string, reviewerId: string | null, reviewerId2: string | null) => {
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

  const handleDeleteSubmission = (subId: string) => {
    setSubIdToDelete(subId)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!subIdToDelete) return
    setDeleteLoading(true)
    try {
      const subAttachments = attachments.filter((a) => a.submission_id === subIdToDelete)
      for (const att of subAttachments) {
        if (att.file_url) {
          try {
            await supabase.storage.from('wisdom-private').remove([att.file_url])
          } catch (e) {
            console.error('Failed to remove attachment file from storage:', e)
          }
        }
      }
      await supabase.from('ethics_attachments').delete().eq('submission_id', subIdToDelete)
      await supabase.from('ethics_evaluations').delete().eq('submission_id', subIdToDelete)
      const { error: subError } = await supabase.from('ethics_submissions').delete().eq('id', subIdToDelete)
      if (subError) throw subError

      setDeleteConfirmOpen(false)
      setSubIdToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
      queryClient.invalidateQueries({ queryKey: ['ethics_attachments'] })
      fetchReviewSubmissions()
      triggerAlert('ลบสำเร็จ', 'ลบคำขอรับการพิจารณาจริยธรรมเรียบร้อยแล้ว', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถลบคำขอได้: ${err.message}`, 'danger')
    } finally {
      setDeleteLoading(false)
    }
  }

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
    } catch (err) {
      console.error(err)
    }
  }

  const handleExportClick = async (sub: any) => {
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
    } catch (err) {
      console.error(err)
    }

    let evs: EthicsEvaluation[] = []
    try {
      const { data: evalData, error: evalError } = await supabase
        .from('ethics_evaluations')
        .select('*')
        .eq('submission_id', sub.id)
        .order('created_at', { ascending: true })
      if (evalError) throw evalError
      evs = (evalData || []) as EthicsEvaluation[]
    } catch (err) {
      console.error(err)
    }

    handleExportEvaluation(freshSub, submitterName, evs)
  }

  const openReviewModalFor = (sub: EthicsSubmission) => {
    setSelectedSubForReview(sub)
    setReviewModalOpen(true)
  }

  // Auto-open assigned submission when landing via ?highlight=<id>
  const searchParams = useSearchParams()
  const highlightId = searchParams ? searchParams.get('highlight') : null
  const [hasAutoOpened, setHasAutoOpened] = useState(false)

  useEffect(() => {
    if (!highlightId || hasAutoOpened || reviewSubmissions.length === 0) return
    const target = reviewSubmissions.find((s) => s.id === highlightId)
    if (target) {
      setHasAutoOpened(true)
      openReviewModalFor(target)
    }
  }, [highlightId, reviewSubmissions, hasAutoOpened])

  const isReviewTabVisible = hasRole(profile?.role, 'expert') || hasRole(profile?.role, 'admin')

  const mergedSubmissions: EthicsSubmission[] = (() => {
    const byId = new Map<string, EthicsSubmission>()
    reviewSubmissions.forEach((sub) => byId.set(sub.id, sub))
    submissions.forEach((sub) => {
      if (!byId.has(sub.id)) byId.set(sub.id, sub)
    })
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  })()

  const waitingCount = mergedSubmissions.filter((s) => s.status === 'ยื่นแล้ว').length
  const reviewingCount = mergedSubmissions.filter((s) => s.status === 'กำลังตรวจ').length
  const pendingApprovalCount = mergedSubmissions.filter((s) => s.status === 'รออนุมัติ').length
  const approvedCount = mergedSubmissions.filter((s) => s.status === 'อนุมัติ').length
  const rejectedCount = mergedSubmissions.filter((s) => s.status === 'ไม่อนุมัติ').length
  const sentBackCount = mergedSubmissions.filter((s) => s.status === 'ส่งกลับแก้ไข').length

  const visibleSubmissions = mergedSubmissions.filter((s) => {
    if (activeQueueTab === 'submitted') return s.status === 'ยื่นแล้ว'
    if (activeQueueTab === 'reviewing') return s.status === 'กำลังตรวจ'
    if (activeQueueTab === 'pending_approval') return s.status === 'รออนุมัติ'
    if (activeQueueTab === 'approved') return s.status === 'อนุมัติ'
    if (activeQueueTab === 'rejected') return s.status === 'ไม่อนุมัติ'
    if (activeQueueTab === 'sent_back') return s.status === 'ส่งกลับแก้ไข'
    return true
  })

  const columns = createEthicsTableColumns({
    user,
    profile,
    isReviewTabVisible,
    expertProfiles,
    evaluationsBySubmission,
    onOpenNotesModal: handleOpenNotesModal,
    onOpenAdminDecision: (sub) => {
      setSelectedSubForAdminDecision(sub)
      setAdminDecisionModalOpen(true)
    },
    onOpenRevisionModal: (sub) => {
      setSelectedSubForRevision(sub)
      setRevisionModalOpen(true)
    },
    onOpenReviewModal: openReviewModalFor,
    onOpenAssignModal: (sub) => {
      setSelectedSubForAssign(sub)
      setAssignModalOpen(true)
    },
    onExportClick: handleExportClick,
    onOpenSendBackModal: (sub) => {
      setSelectedSubForSendBack(sub)
      setSendBackModalOpen(true)
    },
    onDeleteSubmission: handleDeleteSubmission,
  })

  return (
    <div className="flex-1 space-y-6 animate-fadeIn">
      <PageHeader
        title={isReviewTabVisible ? 'คิวพิจารณาจริยธรรมการวิจัย' : 'รายการยื่นจริยธรรมการวิจัย'}
        subtitle="Research Ethics — ติดตามสถานะและพิจารณาคำขอรับรองจริยธรรมการวิจัยในมนุษย์ (IRB)"
        extraBadge="Ethics Review Board"
        action={
          isPageAllowed('ethics_submit') ? (
            <Link href="/ethics" className="shrink-0 btn-primary text-xs flex items-center gap-2 !py-2.5 !px-5">
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              <span>ยื่นคำขอใหม่</span>
            </Link>
          ) : undefined
        }
      />

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

      {/* Extracted Modals */}
      <RevisionDialog
        open={revisionModalOpen}
        onOpenChange={setRevisionModalOpen}
        submission={selectedSubForRevision}
        currentUserId={user?.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
          queryClient.invalidateQueries({ queryKey: ['ethics_attachments'] })
          fetchReviewSubmissions()
        }}
      />

      <NotesDialog
        open={notesModalOpen}
        onOpenChange={setNotesModalOpen}
        submission={selectedSubForNotes}
        evaluations={notesModalEvaluations}
        expertProfiles={expertProfiles}
      />

      <AttachmentsDialog
        open={attachmentsModalOpen}
        onOpenChange={setAttachmentsModalOpen}
        submission={selectedSubForAttachments}
        attachments={attachments}
        onDownloadFile={handleDownloadFile}
      />

      <ReviewFormDialog
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        submission={selectedSubForReview}
        evaluations={selectedSubForReview ? evaluationsBySubmission[selectedSubForReview.id] || [] : []}
        attachments={attachments}
        currentUserId={user?.id}
        criteriaOptions={getOptionsByCategory('ethics_criteria')}
        onSuccess={() => {
          fetchReviewSubmissions()
          fetchEvaluationCounts()
          queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
          queryClient.invalidateQueries({ queryKey: ['ethics_attachments'] })
        }}
        triggerAlert={triggerAlert}
        onDownloadFile={handleDownloadFile}
      />

      <AssignReviewerDialog
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        submission={selectedSubForAssign}
        expertProfiles={expertProfiles}
        onAssign={handleAssignReviewer}
        triggerAlert={triggerAlert}
      />

      <SendBackDialog
        open={sendBackModalOpen}
        onOpenChange={setSendBackModalOpen}
        submission={selectedSubForSendBack}
        currentUserId={user?.id}
        onSuccess={() => {
          fetchReviewSubmissions()
          fetchEvaluationCounts()
          queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
          queryClient.invalidateQueries({ queryKey: ['ethics_attachments'] })
        }}
        triggerAlert={triggerAlert}
      />

      <AdminDecisionDialog
        open={adminDecisionModalOpen}
        onOpenChange={setAdminDecisionModalOpen}
        submission={selectedSubForAdminDecision}
        evaluations={
          selectedSubForAdminDecision ? evaluationsBySubmission[selectedSubForAdminDecision.id] || [] : []
        }
        currentUserId={user?.id}
        onSuccess={() => {
          fetchReviewSubmissions()
          fetchEvaluationCounts()
          queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
          queryClient.invalidateQueries({ queryKey: ['ethics_attachments'] })
        }}
        triggerAlert={triggerAlert}
      />

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
