'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
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
  ClipboardCheck
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
  }

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
        const subAttach = attachments.filter(a => a.submission_id === sub.id)
        return (
          <div className="flex flex-wrap gap-1.5 items-center justify-center">
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
                              { val: 'pass', label: 'ผ่าน', color: 'text-[#16A34A] hover:bg-emerald-100 hover:text-[#15803D] peer-checked:bg-[#16A34A] peer-checked:text-white peer-checked:hover:bg-[#15803D]' },
                              { val: 'fail', label: 'ต้องแก้ไข', color: 'text-[#D97706] hover:bg-amber-100 hover:text-[#B45309] peer-checked:bg-[#D97706] peer-checked:text-white peer-checked:hover:bg-[#B45309]' },
                              { val: 'na', label: 'N/A', color: 'text-[#64748B] hover:bg-slate-200 hover:text-[#1E293B] peer-checked:bg-[#64748B] peer-checked:text-white peer-checked:hover:bg-[#475569]' }
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
                                <div className={`py-1.5 rounded-lg transition-colors font-extrabold peer-checked:shadow-xs ${opt.color}`}>
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
