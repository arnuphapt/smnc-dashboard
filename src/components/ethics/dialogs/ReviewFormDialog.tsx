'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronLeft, ChevronRight, Download, FileEdit, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EthicsSubmission, EthicsEvaluation, EthicsAttachment } from '@/types/ethics'
import {
  EVALUATION_CRITERIA,
  RISK_LEVEL_OPTIONS,
  REPORT_INTERVAL_OPTIONS,
  parseReviewerNotes,
  serializeReviewerNotes,
  translateEvaluationStatus,
  deriveSubmissionStatus
} from '@/components/views/masterdata/EthicsTab'

interface ReviewFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: EthicsSubmission | null
  evaluations: EthicsEvaluation[]
  attachments: EthicsAttachment[]
  currentUserId?: string
  criteriaOptions?: Array<{ id: string; value: string }>
  onSuccess: () => void
  triggerAlert: (title: string, description: string, variant?: 'primary' | 'danger' | 'warning') => void
  onDownloadFile: (fileUrl: string) => Promise<void>
}

const inputBase = "w-full text-xs px-3.5 py-2.5 rounded-xl focus:outline-none transition-all duration-200"
const inputSty = { border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A' }

export const ReviewFormDialog: React.FC<ReviewFormDialogProps> = ({
  open,
  onOpenChange,
  submission,
  evaluations,
  attachments,
  currentUserId,
  criteriaOptions = [],
  onSuccess,
  triggerAlert,
  onDownloadFile,
}) => {
  const supabase = createClient()

  const [reviewStep, setReviewStep] = useState(1)
  const [reviewFiles, setReviewFiles] = useState<FileList | null>(null)
  const [reviewStatus, setReviewStatus] = useState('อนุมัติ')
  const [reviewNotes, setReviewNotes] = useState('')
  const [riskLevel, setRiskLevel] = useState('1')
  const [progressReportInterval, setProgressReportInterval] = useState('12')
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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !submission) return
    setReviewStep(1)
    setReviewFiles(null)
    setSaving(false)

    const validStatuses = ['อนุมัติ', 'ไม่อนุมัติ', 'ส่งกลับแก้ไข']
    const ownEvaluation = evaluations.find((ev) => ev.reviewer_id === currentUserId)
    setReviewStatus(ownEvaluation && validStatuses.includes(ownEvaluation.status) ? ownEvaluation.status : 'อนุมัติ')

    const parsed = parseReviewerNotes(ownEvaluation?.reviewer_notes || submission.reviewer_notes || '')
    setScores(parsed.scores)
    setRevisionDetails(parsed.revisionDetails || { obj: '', method: '', privacy: '', consent: '', risk: '', benefit: '' })
    setRiskLevel(parsed.riskLevel)
    setProgressReportInterval(parsed.progressReportInterval)

    let cleanComments = parsed.comments
      .replace(/\[.*?\]/g, '')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      .trim()
    setReviewNotes(cleanComments)
  }, [open, submission, currentUserId, evaluations])

  if (!submission) return null

  const handleSave = async () => {
    if (!currentUserId) {
      triggerAlert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่', 'danger')
      return
    }
    setSaving(true)
    try {
      const serialized = serializeReviewerNotes(scores, reviewNotes, riskLevel, progressReportInterval, revisionDetails)

      const { error: evalError } = await supabase
        .from('ethics_evaluations')
        .upsert(
          { submission_id: submission.id, reviewer_id: currentUserId, status: reviewStatus, reviewer_notes: serialized },
          { onConflict: 'submission_id,reviewer_id' }
        )
      if (evalError) throw evalError

      const { data: freshEvaluations, error: fetchEvalError } = await supabase
        .from('ethics_evaluations')
        .select('*')
        .eq('submission_id', submission.id)
      if (fetchEvalError) throw fetchEvalError

      const assignedCount = [submission.assigned_reviewer_id, submission.assigned_reviewer_id_2].filter(Boolean).length
      const derivedStatus = deriveSubmissionStatus(freshEvaluations || [], assignedCount)

      const { error: subError } = await supabase
        .from('ethics_submissions')
        .update({ status: derivedStatus })
        .eq('id', submission.id)
      if (subError) throw subError

      if (reviewFiles && reviewFiles.length > 0) {
        for (let i = 0; i < reviewFiles.length; i++) {
          const file = reviewFiles[i]
          const extIndex = file.name.lastIndexOf('.')
          const ext = extIndex !== -1 ? file.name.substring(extIndex) : ''
          const base = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name
          const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, '_')
          const safeName = /[a-zA-Z0-9]/.test(sanitizedBase) ? sanitizedBase : 'doc'
          const storagePath = `ethics/${currentUserId || 'eval'}/eval_${Date.now()}_${safeName}${ext}`

          const { error: uploadError } = await supabase.storage.from('wisdom-private').upload(storagePath, file)
          if (!uploadError) {
            await supabase.from('ethics_attachments').insert({
              submission_id: submission.id,
              file_url: storagePath,
              file_name: `[เอกสารประเมิน] ${file.name}`,
              file_type: file.type
            })
          }
        }
      }

      onOpenChange(false)
      onSuccess()
      triggerAlert('บันทึกสำเร็จ', 'บันทึกผลการพิจารณาและอัปโหลดเอกสารเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', err.message, 'danger')
    } finally {
      setSaving(false)
    }
  }

  const assignedCount = [submission.assigned_reviewer_id, submission.assigned_reviewer_id_2].filter(Boolean).length
  const slotCount = Math.max(assignedCount, evaluations.length)
  const subAttachments = attachments.filter((a) => a.submission_id === submission.id)

  const STANDARD_KEYS = ['obj', 'method', 'privacy', 'consent', 'risk', 'benefit']
  const activeCriteria = criteriaOptions.length > 0
    ? criteriaOptions.map((opt, idx) => ({
        key: STANDARD_KEYS[idx] || `opt_${opt.id}`,
        label: opt.value.startsWith(`${idx + 1}.`) ? opt.value : `${idx + 1}. ${opt.value}`
      }))
    : EVALUATION_CRITERIA

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl w-full">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#00796B]">พิจารณาข้อเสนอ</p>
          <DialogTitle className="header-display text-base font-black text-[#0F172A]">
            ประเมินจริยธรรมโครงร่างวิจัย
          </DialogTitle>
        </DialogHeader>

        {/* STEPPER PROGRESS INDICATOR */}
        <div className="px-6 py-4 bg-[#FAFDFD] border-b border-[#E2E8F0] shrink-0">
          <div className="flex items-center justify-between relative max-w-md mx-auto">
            {/* Background Track Line with Progress Fill */}
            <div className="absolute top-4 left-14 right-14 h-0.5 bg-[#E2E8F0] z-0 overflow-hidden">
              <div
                className="h-full bg-[#00796B] transition-all duration-300 ease-in-out"
                style={{ width: reviewStep === 1 ? '0%' : reviewStep === 2 ? '50%' : '100%' }}
              />
            </div>

            {[
              { step: 1, label: 'เกณฑ์จริยธรรม' },
              { step: 2, label: 'ความเสี่ยง & รายงาน' },
              { step: 3, label: 'สรุปผล & บันทึก' }
            ].map((s) => {
              const isActive = reviewStep === s.step
              const isDone = reviewStep > s.step
              return (
                <div key={s.step} className="w-28 flex flex-col items-center relative z-10 shrink-0">
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
                    {isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : s.step}
                  </button>
                  <span
                    className={`text-[10px] font-extrabold mt-1.5 transition-colors whitespace-nowrap text-center ${
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
          {/* PROJECT DETAILS & ATTACHMENTS CARD */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
            <div>
              <div className="text-[10px] font-mono font-extrabold text-[#64748B] uppercase tracking-wider">
                ชื่อโครงร่างวิจัย
              </div>
              <div className="text-xs font-extrabold mt-0.5 text-[#0F172A] leading-snug">
                {submission.project_title}
              </div>
            </div>

            {submission.profiles?.email && (
              <div className="text-[11px] text-slate-500 pt-0.5">
                <span className="font-semibold">ผู้ยื่นคำขอ:</span>{' '}
                <span className="font-bold text-slate-800">
                  {submission.profiles.full_name
                    ? `${submission.profiles.full_name} (${submission.profiles.email})`
                    : submission.profiles.email}
                </span>
              </div>
            )}

            {/* PER-REVIEWER EVALUATION STATUS */}
            {slotCount > 0 && (
              <div className="pt-2 border-t border-slate-200/80">
                <div className="text-[10px] font-mono font-extrabold text-[#00796B] uppercase tracking-wider mb-1">
                  สถานะการประเมินของผู้ทรงคุณวุฒิ
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {Array.from({ length: slotCount }).map((_, idx) => {
                    const ev = evaluations[idx]
                    const isSelf = ev?.reviewer_id === currentUserId
                    return (
                      <span key={idx} className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                        ผู้ประเมินที่ {idx + 1}{isSelf ? ' (ตัวคุณ)' : ''}: {ev ? translateEvaluationStatus(ev.status) : 'ยังไม่ได้ประเมิน'}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ATTACHED DOCUMENTS LIST FOR REVIEWER */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="text-[10px] font-mono font-extrabold text-[#00796B] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>เอกสารแนบประกอบโครงร่างวิจัย ({subAttachments.length} ไฟล์)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {subAttachments.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic">ไม่มีเอกสารแนบจากผู้ยื่น</span>
                ) : (
                  subAttachments.map((at) => (
                    <button
                      key={at.id}
                      type="button"
                      onClick={() => onDownloadFile(at.file_url)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white border border-teal-200 text-[#00796B] hover:bg-teal-50 transition cursor-pointer shadow-2xs"
                      title={at.file_name}
                    >
                      <Download className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[320px]">{at.file_name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* STEP 1: ETHICAL CRITERIA ASSESSMENT (CARD-BASED, UNSTRETCHED CONTROLS) */}
          {reviewStep === 1 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    ขั้นตอนที่ 1: ประเมินผลตามรายเกณฑ์ (6 เกณฑ์)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    พิจารณาแต่ละข้อและระบุจุดที่ต้องการให้ผู้วิจัยปรับปรุงแก้ไข (ถ้ามี)
                  </p>
                </div>
                {/* Quick Action: Mark All as Pass */}
                <button
                  type="button"
                  onClick={() => {
                    const passAll: Record<string, 'pass'> = {}
                    activeCriteria.forEach((c) => {
                      passAll[c.key] = 'pass'
                    })
                    setScores(passAll)
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer shadow-2xs shrink-0"
                  title="คลิกเพื่อทำเครื่องหมายผ่านทุกข้อโดยเร็ว"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>ผ่านทุกข้อ</span>
                </button>
              </div>

              <div className="space-y-2">
                {activeCriteria.map((criterion, idx) => {
                  const isPass = scores[criterion.key] === 'pass'
                  const isFail = scores[criterion.key] === 'fail' || scores[criterion.key] === 'na'

                  return (
                    <div
                      key={criterion.key}
                      className={`p-3.5 rounded-2xl border transition-all duration-150 ${
                        isFail
                          ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                          : 'bg-white border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Criterion Title & Index */}
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 transition ${
                              isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900 leading-snug pt-0.5">
                            {criterion.label.replace(/^\d+\.\s*/, '')}
                          </span>
                        </div>

                        {/* Compact Segmented Control (NO Stretched Wide Buttons) */}
                        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setScores((prev) => ({ ...prev, [criterion.key]: 'pass' }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                              isPass
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>ผ่าน</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setScores((prev) => ({ ...prev, [criterion.key]: 'fail' }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                              isFail
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                          >
                            <FileEdit className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>แก้ไข</span>
                          </button>
                        </div>
                      </div>

                      {/* Smoothly Revealed Revision Input ONLY when 'แก้ไข' is selected */}
                      {isFail && (
                        <div className="mt-2.5 pt-2.5 border-t border-amber-200/80 animate-fadeIn">
                          <label className="block text-[11px] font-extrabold text-amber-900 mb-1">
                            ระบุรายละเอียดการแก้ไขสำหรับข้อนี้:
                          </label>
                          <input
                            type="text"
                            placeholder="ระบุสิ่งที่ต้องปรับปรุงแก้ไขในเล่มโครงร่างวิจัย..."
                            value={revisionDetails[criterion.key] || ''}
                            onChange={(e) =>
                              setRevisionDetails((prev) => ({
                                ...prev,
                                [criterion.key]: e.target.value,
                              }))
                            }
                            className="w-full text-xs px-3 py-1.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder:text-slate-400"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2: RISK LEVEL & PROGRESS REPORT INTERVAL */}
          {reviewStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  ขั้นตอนที่ 2: เลือกระดับความเสี่ยงและรอบการรายงาน
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  กำหนดระดับความเสี่ยงตามเกณฑ์จริยธรรม และกำหนดความถี่ในการติดตามความก้าวหน้าโครงการ
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Risk Level Column */}
                <div className="space-y-2 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    ระดับความเสี่ยงของโครงการวิจัย <span className="text-rose-600">*</span>
                  </label>
                  <div className="space-y-1.5">
                    {RISK_LEVEL_OPTIONS.map((opt) => {
                      const isSelected = riskLevel === opt.value
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="risk-level-option"
                            value={opt.value}
                            checked={isSelected}
                            onChange={(e) => setRiskLevel(e.target.value)}
                            className="mt-0.5 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-xs font-bold text-slate-800 leading-snug">
                            {opt.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Progress Report Interval Column */}
                <div className="space-y-2 p-4 bg-slate-50/70 rounded-2xl border border-slate-200 flex flex-col">
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    รอบการรายงานความก้าวหน้าโครงการ <span className="text-rose-600">*</span>
                  </label>
                  <div className="space-y-2 flex-1">
                    {REPORT_INTERVAL_OPTIONS.map((opt) => {
                      const isSelected = progressReportInterval === opt.value
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer font-extrabold text-xs transition ${
                            isSelected
                              ? 'bg-teal-50 border-teal-300 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="progress-report-interval"
                            value={opt.value}
                            checked={isSelected}
                            onChange={(e) => setProgressReportInterval(e.target.value)}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span>{opt.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FINAL STATUS & COMMENTS */}
          {reviewStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  ขั้นตอนที่ 3: สรุปผลการประเมินและข้อเสนอแนะ
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  เลือกมติความเห็นชอบ และระบุข้อเสนอแนะเพิ่มเติมเพื่อประกอบการพิจารณา
                </p>
              </div>

              {/* 3-Card Decision Selector */}
              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-900">
                  มติความเห็นชอบ <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('อนุมัติ')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                      reviewStatus === 'อนุมัติ'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                      reviewStatus === 'อนุมัติ' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </span>
                    <span className="font-extrabold text-xs">เห็นชอบ</span>
                    <span className="text-[10px] text-slate-500">อนุมัติโครงการ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('ส่งกลับแก้ไข')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                      reviewStatus === 'ส่งกลับแก้ไข'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                      reviewStatus === 'ส่งกลับแก้ไข' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <FileEdit className="w-4 h-4 stroke-[2.5]" />
                    </span>
                    <span className="font-extrabold text-xs">ส่งแก้ไข</span>
                    <span className="text-[10px] text-slate-500">ให้ปรับปรุงเอกสาร</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('ไม่อนุมัติ')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                      reviewStatus === 'ไม่อนุมัติ'
                        ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                      reviewStatus === 'ไม่อนุมัติ' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </span>
                    <span className="font-extrabold text-xs">ไม่เห็นชอบ</span>
                    <span className="text-[10px] text-slate-500">ไม่อนุมัติโครงการ</span>
                  </button>
                </div>
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
                <label className="block text-xs font-extrabold mb-1 text-[#0F172A]">
                  แนบไฟล์ข้อเสนอแนะ / เล่มที่ตรวจแก้ <span className="font-normal text-[#64748B]">(ถ้ามี)</span>
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
              onClick={handleSave}
              disabled={saving}
              className="btn-primary rounded-full text-xs font-extrabold gap-1"
            >
              <Check className="w-4 h-4" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกผลการประเมิน'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
