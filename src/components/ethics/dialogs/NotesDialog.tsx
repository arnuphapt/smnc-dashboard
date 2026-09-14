'use client'

import React, { useState, useEffect } from 'react'
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileEdit,
  MessageSquare,
  Shield,
  User,
  XCircle,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EthicsSubmission, EthicsEvaluation } from '@/types/ethics'
import { Profile } from '@/context/AuthContext'
import {
  RISK_LEVEL_OPTIONS,
  REPORT_INTERVAL_OPTIONS,
  parseReviewerNotes,
  translateEvaluationStatus
} from '@/components/views/masterdata/EthicsTab'

interface NotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: EthicsSubmission | null
  evaluations: EthicsEvaluation[]
  expertProfiles?: Profile[]
}

export const NotesDialog: React.FC<NotesDialogProps> = ({
  open,
  onOpenChange,
  submission,
  evaluations,
  expertProfiles = [],
}) => {
  const [activeReviewerIndex, setActiveReviewerIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      setActiveReviewerIndex(0)
      setCopied(false)
    }
  }, [open, submission])

  if (!submission) return null

  const cleanNotes = (notesText: string) =>
    notesText
      .replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*?=== ความเห็นและข้อเสนอแนะเพิ่มเติม ===\s*\n*/, '')
      .replace(/=== ผลการประเมินรายเกณฑ์ ===[\s\S]*$/, '')
      .replace(/===\s*(?:ความเห็นและข้อเสนอแนะเพิ่มเติม|ข้อเสนอแนะเพิ่มเติม)\s*===\s*\n*/, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      .trim()

  const evaluationSource =
    evaluations.length > 0
      ? evaluations
      : submission.reviewer_notes
      ? ([{ reviewer_notes: submission.reviewer_notes } as EthicsEvaluation])
      : []

  const assignedReviewerIds = [submission.assigned_reviewer_id, submission.assigned_reviewer_id_2].filter(Boolean) as string[]
  const slotCount = Math.max(assignedReviewerIds.length, evaluationSource.length, 1)

  // Construct reviewer slot metadata
  const reviewerSlots = Array.from({ length: slotCount }).map((_, idx) => {
    const assignedId = assignedReviewerIds[idx]
    const expert = expertProfiles.find((p) => p.id === assignedId)
    const ev = evaluationSource.find((e) => e.reviewer_id && e.reviewer_id === assignedId) || evaluationSource[idx]
    const reviewerName = `ผู้ทรงคุณวุฒิคนที่ ${idx + 1}`

    return {
      index: idx,
      assignedId,
      expert,
      reviewerName,
      evaluation: ev,
      status: ev?.status || null,
    }
  })

  const currentSlot = reviewerSlots[activeReviewerIndex] || reviewerSlots[0]
  const currentEvaluation = currentSlot?.evaluation

  // Parse notes of current reviewer
  const parsed = parseReviewerNotes(currentEvaluation?.reviewer_notes || '')
  const cleanComm = cleanNotes(parsed.comments)
  const riskOption = RISK_LEVEL_OPTIONS.find((r) => r.value === parsed.riskLevel)
  const riskLabel = riskOption?.label || '1. ไม่เกินความเสี่ยงเล็กน้อย'
  const intervalOption = REPORT_INTERVAL_OPTIONS.find((i) => i.value === parsed.progressReportInterval)
  const intervalLabel = intervalOption?.label || 'ทุก 12 เดือน (1 ปี)'

  const criteriaItems = [
    { label: '1. วัตถุประสงค์และการออกแบบการวิจัย', val: parsed.scores.obj, rev: parsed.revisionDetails?.obj },
    { label: '2. ความเหมาะสมของระเบียบวิธีวิจัยและกลุ่มตัวอย่าง', val: parsed.scores.method, rev: parsed.revisionDetails?.method },
    { label: '3. การปกป้องสิทธิ์ ความเป็นส่วนตัว และข้อมูลส่วนบุคคล', val: parsed.scores.privacy, rev: parsed.revisionDetails?.privacy },
    { label: '4. ความสมบูรณ์ของแบบชี้แจงและใบยินยอม (Informed Consent)', val: parsed.scores.consent, rev: parsed.revisionDetails?.consent },
    { label: '5. มาตรการป้องกันและลดความเสี่ยงต่ออาสาสมัคร', val: parsed.scores.risk, rev: parsed.revisionDetails?.risk },
    { label: '6. สัดส่วนประโยชน์ที่ได้รับเทียบกับความเสี่ยงมีความเหมาะสม', val: parsed.scores.benefit, rev: parsed.revisionDetails?.benefit },
  ]

  const passCount = criteriaItems.filter((c) => c.val === 'pass').length
  const failCount = criteriaItems.filter((c) => c.val === 'fail').length

  const handleCopyAllNotes = () => {
    if (!currentEvaluation) return

    let text = `[สรุปผลการพิจารณาจริยธรรม]\n`
    text += `โครงร่างวิจัย: ${submission.project_title}\n`
    text += `ผู้ประเมิน: ${currentSlot.reviewerName}\n`
    text += `มติการประเมิน: ${translateEvaluationStatus(currentSlot.status || 'รอการประเมิน')}\n`
    text += `ระดับความเสี่ยง: ${riskLabel}\n`
    text += `รอบรายงานความก้าวหน้า: ${intervalLabel}\n\n`
    text += `ผลการประเมินรายเกณฑ์:\n`
    criteriaItems.forEach((c) => {
      text += `- ${c.label}: ${c.val === 'pass' ? 'ผ่าน' : c.val === 'fail' ? 'ต้องแก้ไข' : 'N/A'}\n`
      if (c.rev) text += `  ข้อเสนอแนะ: ${c.rev}\n`
    })
    if (cleanComm) {
      text += `\nข้อเสนอแนะเพิ่มเติม:\n${cleanComm}\n`
    }

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          รอการประเมิน
        </span>
      )
    }
    if (status === 'อนุมัติ') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
          เห็นชอบ (อนุมัติ)
        </span>
      )
    }
    if (status === 'ส่งกลับแก้ไข') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <FileEdit className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
          ส่งกลับแก้ไข
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
        ไม่เห็นชอบ (ไม่อนุมัติ)
      </span>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl lg:max-w-4xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl w-full">
        {/* HEADER */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <div>
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#00796B]">
              ผลการพิจารณาจริยธรรม • REVIEWER NOTES
            </p>
          </div>
          <DialogTitle className="header-display text-base font-black text-[#0F172A] leading-snug mt-1">
            {submission.project_title}
          </DialogTitle>
          {submission.profiles?.email && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>ผู้ยื่นคำขอ:</span>
              <span className="font-bold text-slate-800">
                {submission.profiles.full_name
                  ? `${submission.profiles.full_name} (${submission.profiles.email})`
                  : submission.profiles.email}
              </span>
            </div>
          )}
        </DialogHeader>

        {/* REVIEWER SWITCHER TABS (IF MULTIPLE SLOTS) */}
        {slotCount > 1 && (
          <div className="px-6 py-2.5 bg-[#FAFDFD] border-b border-slate-200/90 shrink-0">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              {reviewerSlots.map((slot, idx) => {
                const isSelected = activeReviewerIndex === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveReviewerIndex(idx)}
                    className={`flex-1 flex items-center justify-between px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center transition ${
                          isSelected ? 'bg-[#00796B] text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-extrabold">{slot.reviewerName}</span>
                    </div>
                    <div>
                      {slot.status ? (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            slot.status === 'อนุมัติ'
                              ? 'bg-emerald-100 text-emerald-800'
                              : slot.status === 'ส่งกลับแก้ไข'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {translateEvaluationStatus(slot.status)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">ยังไม่ประเมิน</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* CONTENT BODY */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-4">
          {!currentEvaluation ? (
            /* EMPTY STATE: NOT EVALUATED YET */
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center rounded-3xl bg-slate-50/80 border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  {currentSlot.reviewerName} ยังไม่ได้ส่งผลการประเมิน
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  ผลการพิจารณารายเกณฑ์ ระดับความเสี่ยง และข้อเสนอแนะในการปรับปรุงจะแสดงที่นี่โดยอัตโนมัติเมื่อผู้ทรงคุณวุฒิดำเนินการเสร็จสิ้น
                </p>
              </div>
            </div>
          ) : (
            /* EVALUATION DETAILS SCORECARD */
            <div className="space-y-4 animate-fadeIn">
              {/* REVIEWER SUMMARY CARD */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#00796B] flex items-center justify-center font-black text-sm shrink-0">
                    {activeReviewerIndex + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900">{currentSlot.reviewerName}</h4>
                    </div>
                    {currentEvaluation.updated_at && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        วันที่บันทึกผล:{' '}
                        {new Date(currentEvaluation.updated_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="self-start sm:self-center">
                  {getStatusBadge(currentSlot.status)}
                </div>
              </div>

              {/* 2-COLUMN METRICS: RISK LEVEL & REPORT INTERVAL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] font-extrabold">
                    <Shield className="w-4 h-4 text-teal-600 stroke-[2]" />
                    <span>ระดับความเสี่ยงของโครงการ</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 pt-0.5 leading-snug">
                    {riskLabel}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] font-extrabold">
                    <Calendar className="w-4 h-4 text-teal-600 stroke-[2]" />
                    <span>รอบการรายงานความก้าวหน้า</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 pt-0.5 leading-snug">
                    {intervalLabel}
                  </p>
                </div>
              </div>

              {/* 6 CRITERIA SCORECARD */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900">
                      ผลการพิจารณาตามเกณฑ์จริยธรรม (6 ด้าน)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-extrabold">
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      ผ่าน {passCount}/6 ข้อ
                    </span>
                    {failCount > 0 && (
                      <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        แก้ไข {failCount} ข้อ
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {criteriaItems.map((c, idx) => {
                    const isPass = c.val === 'pass'
                    const isFail = c.val === 'fail'
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition ${
                          isFail
                            ? 'bg-amber-50/40 border-amber-300/80 shadow-2xs'
                            : 'bg-white border-slate-200/90'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isFail
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 leading-snug pt-0.5">
                              {c.label.replace(/^\d+\.\s*/, '')}
                            </span>
                          </div>

                          <div className="shrink-0">
                            {isPass ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                ผ่าน
                              </span>
                            ) : isFail ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                <FileEdit className="w-3.5 h-3.5 stroke-[2.5]" />
                                แก้ไข
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                N/A
                              </span>
                            )}
                          </div>
                        </div>

                        {/* REVISION DETAILS CALLOUT */}
                        {c.rev && (
                          <div className="mt-2.5 ml-7 p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-950">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <span className="font-extrabold text-[11px] text-amber-900 block">
                                รายละเอียดจุดที่ต้องปรับปรุงแก้ไข:
                              </span>
                              <p className="leading-relaxed text-amber-950 font-medium whitespace-pre-wrap">
                                {c.rev}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ADDITIONAL COMMENTS */}
              {cleanComm && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                      <MessageSquare className="w-4 h-4 text-[#00796B]" />
                      <span>ความเห็นและข้อเสนอแนะเพิ่มเติม</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {cleanComm}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div>
            {currentEvaluation && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyAllNotes}
                className="rounded-full text-xs font-bold gap-1.5 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span className="text-emerald-700">คัดลอกข้อความแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>คัดลอกผลการประเมิน</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs font-extrabold px-5 btn-primary cursor-pointer"
          >
            ปิดหน้าต่าง
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

