'use client'

import React from 'react'
import { DataTableColumn } from '@/components/DataTable'
import { StatusBadge } from '@/components/StatusBadge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Scale,
  UploadCloud,
  ClipboardCheck,
  UserCheck,
  ExternalLink,
  MoreHorizontal,
  FileEdit,
  Trash2,
  Eye,
  Paperclip,
} from 'lucide-react'
import { EthicsSubmission, EthicsEvaluation, EthicsAttachment } from '@/types/ethics'
import { Profile } from '@/context/AuthContext'
import { hasRole } from '@/utils/roleHelper'
import { translateEvaluationStatus } from '@/components/views/masterdata/EthicsTab'

export interface CreateEthicsTableColumnsParams {
  user: any
  profile: Profile | null
  isReviewTabVisible: boolean
  expertProfiles: Profile[]
  evaluationsBySubmission: Record<string, EthicsEvaluation[]>
  attachments?: EthicsAttachment[]
  onOpenNotesModal: (sub: EthicsSubmission) => void
  onOpenAdminDecision: (sub: EthicsSubmission) => void
  onOpenRevisionModal: (sub: EthicsSubmission) => void
  onOpenReviewModal: (sub: EthicsSubmission) => void
  onOpenAssignModal: (sub: EthicsSubmission) => void
  onExportClick: (sub: EthicsSubmission) => void
  onOpenSendBackModal: (sub: EthicsSubmission) => void
  onOpenAttachmentsModal?: (sub: EthicsSubmission) => void
  onDeleteSubmission: (subId: string) => void
}

export function createEthicsTableColumns({
  user,
  profile,
  isReviewTabVisible,
  expertProfiles,
  evaluationsBySubmission,
  attachments,
  onOpenNotesModal,
  onOpenAdminDecision,
  onOpenRevisionModal,
  onOpenReviewModal,
  onOpenAssignModal,
  onExportClick,
  onOpenSendBackModal,
  onOpenAttachmentsModal,
  onDeleteSubmission,
}: CreateEthicsTableColumnsParams): DataTableColumn<EthicsSubmission>[] {
  const canAssign = hasRole(profile?.role, 'admin') || hasRole(profile?.role, 'assistant_admin')

  return [
    {
      key: 'project_title',
      header: 'ชื่อโครงร่างวิจัย',
      className: 'min-w-[420px] max-w-[650px]',
      render: (sub) => {
        const subAttachments = (attachments || []).filter((a) => a.submission_id === sub.id)
        const hasAttachments = subAttachments.length > 0
        const hasRevisionFiles = subAttachments.some((a) => a.file_name?.includes('[ฉบับแก้ไข]'))
        const hasSendBackFiles = subAttachments.some((a) => a.file_name?.includes('[เอกสารส่งกลับแก้ไข]'))

        return (
          <div className="min-w-[380px] space-y-1.5 py-1">
            <div className="text-xs font-extrabold text-[#0F172A] leading-relaxed break-words">{sub.project_title}</div>
            {sub.project_description && (
              <p className="text-[11px] font-medium text-[#64748B] leading-normal line-clamp-3">
                {sub.project_description}
              </p>
            )}
            {hasAttachments && onOpenAttachmentsModal && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <button
                  type="button"
                  onClick={() => onOpenAttachmentsModal(sub)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold text-[#00796B] bg-[#E8F6F5] border border-[#BCE5E2] hover:bg-[#D4EFEA] transition cursor-pointer shadow-2xs"
                  title="คลิกเพื่อดูและดาวน์โหลดเอกสารแนบทั้งหมด"
                >
                  <Paperclip className="w-3 h-3 text-[#00796B]" />
                  <span>เอกสารแนบ ({subAttachments.length})</span>
                </button>
                {hasSendBackFiles && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                    มีเอกสารชี้แจงแก้ไข
                  </span>
                )}
                {hasRevisionFiles && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    มีเล่มฉบับแก้ไข
                  </span>
                )}
              </div>
            )}
          </div>
        )
      },
    },
    ...(canAssign
      ? [
          {
            key: 'assigned_reviewer',
            header: 'ผู้ทรงคุณวุฒิที่มอบหมาย',
            render: (sub: EthicsSubmission) => {
              const assignedUser = expertProfiles.find((p) => p.id === sub.assigned_reviewer_id)
              const assignedUser2 = expertProfiles.find((p) => p.id === sub.assigned_reviewer_id_2)
              if (!assignedUser && !assignedUser2) {
                return <span className="text-xs font-semibold text-[#64748B] whitespace-nowrap">ยังไม่ได้มอบหมาย</span>
              }
              const reviewerNames = [
                assignedUser?.full_name || assignedUser?.email,
                assignedUser2?.full_name || assignedUser2?.email,
              ].filter(Boolean)
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
          } as DataTableColumn<EthicsSubmission>,
        ]
      : []),
    {
      key: 'status',
      header: 'สถานะ',
      render: (sub) => {
        const assignedCount = [sub.assigned_reviewer_id, sub.assigned_reviewer_id_2].filter(Boolean).length
        const subEvaluations = evaluationsBySubmission[sub.id] || []
        const completedEvaluations = subEvaluations.filter((e) => e.status !== 'ร่าง')
        const evaluatedCount = completedEvaluations.length
        const slotCount = Math.max(assignedCount, subEvaluations.length)
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
        const hasEvaluations = (evaluationsBySubmission[sub.id] || []).filter((e) => e.status !== 'ร่าง').length > 0
        const hasNotes = Boolean(sub.reviewer_notes || hasEvaluations)
        return hasNotes ? (
          <button
            onClick={() => onOpenNotesModal(sub)}
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
      className: 'w-[180px]',
      render: (sub) => {
        const isOwner = sub.submitter_id === user?.id
        const canAdmin = canAssign
        const exportAssignedCount = [sub.assigned_reviewer_id, sub.assigned_reviewer_id_2].filter(Boolean).length
        const exportEvaluatedCount = (evaluationsBySubmission[sub.id] || []).filter((e) => e.status !== 'ร่าง').length
        const allExpertsEvaluated = exportAssignedCount > 0 && exportEvaluatedCount >= exportAssignedCount
        const hasPriorEvaluations = exportEvaluatedCount > 0
        const isResubmitted = sub.status === 'ยื่นแล้ว' && hasPriorEvaluations
        const isReadyForAdminDecision =
          canAdmin &&
          sub.status !== 'ส่งกลับแก้ไข' &&
          sub.status !== 'ไม่อนุมัติ' &&
          sub.status !== 'อนุมัติ' &&
          (sub.status === 'รออนุมัติ' || (allExpertsEvaluated && sub.status === 'กำลังตรวจ') || isResubmitted)
        const hasOwnEvaluated = (evaluationsBySubmission[sub.id] || []).some((ev) => ev.reviewer_id === user?.id && ev.status !== 'ร่าง')
        const canDelete = isOwner || canAdmin

        // Determine the single Primary Contextual Action
        let primaryAction: {
          key: string
          label: string
          icon: React.ReactNode
          onClick: () => void
          className: string
        } | null = null

        if (isOwner && sub.status === 'ส่งกลับแก้ไข') {
          primaryAction = {
            key: 'resubmit',
            label: 'ยื่นฉบับแก้ไข',
            icon: <UploadCloud className="w-3.5 h-3.5" />,
            onClick: () => onOpenRevisionModal(sub),
            className:
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#00796B] text-white hover:bg-[#005F56] transition cursor-pointer shadow-xs whitespace-nowrap',
          }
        } else if (isReadyForAdminDecision) {
          primaryAction = {
            key: 'admin_decision',
            label: 'ตัดสินผล',
            icon: <Scale className="w-3.5 h-3.5" />,
            onClick: () => onOpenAdminDecision(sub),
            className:
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#00796B] text-white hover:bg-[#005F56] transition cursor-pointer shadow-xs whitespace-nowrap',
          }
        } else if (isReviewTabVisible && !hasOwnEvaluated && (sub.status === 'ยื่นแล้ว' || sub.status === 'กำลังตรวจ')) {
          primaryAction = {
            key: 'review',
            label: 'พิจารณาผล',
            icon: <ClipboardCheck className="w-3.5 h-3.5" />,
            onClick: () => onOpenReviewModal(sub),
            className:
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#00796B] text-white hover:bg-[#005F56] transition cursor-pointer shadow-xs whitespace-nowrap',
          }
        } else if (canAssign && exportAssignedCount === 0) {
          primaryAction = {
            key: 'assign',
            label: 'มอบหมายกรรมการ',
            icon: <UserCheck className="w-3.5 h-3.5" />,
            onClick: () => onOpenAssignModal(sub),
            className:
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white transition cursor-pointer shadow-xs whitespace-nowrap',
          }
        } else if (allExpertsEvaluated || sub.status === 'อนุมัติ') {
          primaryAction = {
            key: 'export',
            label: 'รายงานผล',
            icon: <ExternalLink className="w-3.5 h-3.5" />,
            onClick: () => onExportClick(sub),
            className:
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border border-[#DAEEFF] bg-[#F0F7FF] text-[#00796B] hover:bg-[#00796B] hover:text-white transition cursor-pointer shadow-xs whitespace-nowrap',
          }
        }

        const showQuickReport = primaryAction?.key !== 'export' && (allExpertsEvaluated || sub.status === 'อนุมัติ')

        return (
          <div className="flex items-center justify-center gap-1.5">
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className={primaryAction.className}
                title={primaryAction.label}
              >
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </button>
            )}

            {showQuickReport && (
              <button
                type="button"
                onClick={() => onExportClick(sub)}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-[#DAEEFF] bg-[#F0F7FF] text-[#00796B] hover:bg-[#00796B] hover:text-white transition cursor-pointer shadow-xs shrink-0"
                title="ดูรายงานผลการประเมิน (PDF)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                className="w-7 h-7 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                title="ตัวเลือกเพิ่มเติม"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border border-slate-200 bg-white text-xs">
                <div className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-400 px-2.5 py-1 select-none">
                  การจัดการคำขอ
                </div>
                {canAssign && (
                  <DropdownMenuItem
                    onClick={() => onOpenAssignModal(sub)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>มอบหมาย / เปลี่ยนกรรมการ</span>
                  </DropdownMenuItem>
                )}
                {isReviewTabVisible && (
                  <DropdownMenuItem
                    onClick={() => onOpenReviewModal(sub)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <ClipboardCheck className="w-4 h-4 text-teal-600" />
                    <span>แบบฟอร์มประเมินผล</span>
                  </DropdownMenuItem>
                )}
                {(allExpertsEvaluated || sub.status === 'อนุมัติ') && (
                  <DropdownMenuItem
                    onClick={() => onExportClick(sub)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink className="w-4 h-4 text-sky-600" />
                    <span>รายงานผลการประเมิน (PDF)</span>
                  </DropdownMenuItem>
                )}
                {onOpenAttachmentsModal && (
                  <DropdownMenuItem
                    onClick={() => onOpenAttachmentsModal(sub)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Paperclip className="w-4 h-4 text-[#00796B]" />
                    <span>ดูเอกสารแนบทั้งหมด ({((attachments || []).filter((a) => a.submission_id === sub.id)).length} ไฟล์)</span>
                  </DropdownMenuItem>
                )}

                {canAdmin && (
                  <>
                    <DropdownMenuSeparator className="my-1 border-slate-100" />
                    <div className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-400 px-2.5 py-1 select-none">
                      มติผู้ดูแลระบบ
                    </div>
                    <DropdownMenuItem
                      onClick={() => onOpenAdminDecision(sub)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer font-bold text-emerald-700 hover:bg-emerald-50"
                    >
                      <Scale className="w-4 h-4 text-emerald-600" />
                      <span>ตัดสินผลโครงการ (เคาะผล)</span>
                    </DropdownMenuItem>
                    {sub.status !== 'ส่งกลับแก้ไข' && (
                      <DropdownMenuItem
                        onClick={() => onOpenSendBackModal(sub)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer font-bold text-amber-700 hover:bg-amber-50"
                      >
                        <FileEdit className="w-4 h-4 text-amber-600" />
                        <span>ส่งกลับให้แก้ไขเล่ม</span>
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {canDelete && (
                  <>
                    <DropdownMenuSeparator className="my-1 border-slate-100" />
                    <DropdownMenuItem
                      onClick={() => onDeleteSubmission(sub.id)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer font-bold text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>ลบคำขอนี้</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}

