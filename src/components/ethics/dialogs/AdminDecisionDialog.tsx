'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, FileEdit, Scale, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EthicsSubmission, EthicsEvaluation } from '@/types/ethics'
import { parseReviewerNotes, translateEvaluationStatus } from '@/components/views/masterdata/EthicsTab'

interface AdminDecisionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: EthicsSubmission | null
  evaluations: EthicsEvaluation[]
  currentUserId?: string
  onSuccess: () => void
  triggerAlert: (title: string, description: string, variant?: 'primary' | 'danger' | 'warning') => void
}

export const AdminDecisionDialog: React.FC<AdminDecisionDialogProps> = ({
  open,
  onOpenChange,
  submission,
  evaluations,
  currentUserId,
  onSuccess,
  triggerAlert,
}) => {
  const supabase = createClient()
  const [action, setAction] = useState<'approve' | 'send_back' | 'reject'>('approve')
  const [reason, setReason] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setAction('approve')
      setReason('')
      setFiles(null)
      setError('')
      setSubmitting(false)
    }
  }, [open, submission])

  if (!submission) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (action === 'reject' && !reason.trim()) {
        setError('กรุณาระบุเหตุผลในการไม่อนุมัติโครงการ')
        setSubmitting(false)
        return
      }
      if (action === 'send_back' && !reason.trim()) {
        setError('กรุณาระบุข้อเสนอแนะหรือประเด็นที่ต้องแก้ไข')
        setSubmitting(false)
        return
      }

      const timestamp = new Date().toLocaleString('th-TH')
      let newStatus = 'อนุมัติ'
      let appendedNote = ''

      if (action === 'approve') {
        newStatus = 'อนุมัติ'
        appendedNote = `\n\n[ระบบ: ผู้ดูแลระบบอนุมัติโครงการเมื่อ ${timestamp}]\n-----------------------------------\n`
      } else if (action === 'reject') {
        newStatus = 'ไม่อนุมัติ'
        appendedNote = `\n\n[ระบบ: ผู้ดูแลระบบไม่อนุมัติโครงการเมื่อ ${timestamp}]\nเหตุผล: ${reason.trim()}\n-----------------------------------\n`
      } else if (action === 'send_back') {
        newStatus = 'ส่งกลับแก้ไข'
        appendedNote = `\n\n[ระบบ: ผู้ดูแลระบบส่งกลับแก้ไขเมื่อ ${timestamp}]\nเหตุผล/ข้อเสนอแนะ: ${reason.trim()}\n-----------------------------------\n`

        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const extIndex = file.name.lastIndexOf('.')
            const ext = extIndex !== -1 ? file.name.substring(extIndex) : ''
            const base = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name
            const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, '_')
            const safeName = /[a-zA-Z0-9]/.test(sanitizedBase) ? sanitizedBase : 'doc'
            const storagePath = `ethics/${currentUserId || 'admin'}/sendback_${Date.now()}_${safeName}${ext}`

            const { error: uploadError } = await supabase.storage.from('wisdom-private').upload(storagePath, file)
            if (!uploadError) {
              await supabase.from('ethics_attachments').insert({
                submission_id: submission.id,
                file_url: storagePath,
                file_name: `[เอกสารส่งกลับแก้ไข] ${file.name}`,
                file_type: file.type
              })
            }
          }
        }
      }

      const newNotes = (submission.reviewer_notes || '') + appendedNote

      const { error: updateError } = await supabase
        .from('ethics_submissions')
        .update({
          status: newStatus,
          reviewer_notes: newNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', submission.id)

      if (updateError) throw updateError

      onOpenChange(false)
      onSuccess()

      const alertTitle = action === 'approve'
        ? 'อนุมัติสำเร็จ'
        : action === 'send_back'
        ? 'ส่งกลับแก้ไขสำเร็จ'
        : 'บันทึกไม่อนุมัติสำเร็จ'
      const alertMsg = action === 'approve'
        ? 'ผู้ดูแลระบบอนุมัติโครงการวิจัยเรียบร้อยแล้ว'
        : action === 'send_back'
        ? 'ส่งข้อเสนอโครงการกลับให้นักวิจัยปรับปรุงเรียบร้อยแล้ว'
        : 'บันทึกสถานะไม่อนุมัติโครงการเรียบร้อยแล้ว'

      triggerAlert(alertTitle, alertMsg, 'primary')
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกผลการตัดสิน')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/70">
              <Scale className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#00796B]">
                มติขั้นสุดท้ายโดยผู้ดูแลระบบ (Admin Gate)
              </p>
              <DialogTitle className="header-display text-base font-black text-[#0F172A]">
                ตัดสินผลการพิจารณาจริยธรรมการวิจัย
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Project Details Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div>
              <span className="text-[10px] font-mono font-extrabold text-slate-500 uppercase tracking-wider">
                ชื่อโครงร่างวิจัย
              </span>
              <p className="font-extrabold text-slate-900 mt-0.5 leading-snug">
                {submission.project_title}
              </p>
            </div>
            {submission.profiles?.email && (
              <div className="text-[11px] text-slate-500">
                <span className="font-semibold">ผู้ยื่นคำขอ:</span> {submission.profiles.email}
              </div>
            )}

            {/* Expert Reviewers summary */}
            {evaluations.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-mono font-extrabold text-teal-700 uppercase tracking-wider">
                  สรุปผลการประเมินจากผู้ทรงคุณวุฒิ ({evaluations.length} ท่าน)
                </span>
                <div className="mt-1.5 space-y-1.5">
                  {evaluations.map((ev, idx) => {
                    const parsed = parseReviewerNotes(ev.reviewer_notes || '')
                    const comments = parsed.comments?.trim()
                    return (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">ผู้ประเมินที่ {idx + 1}</span>
                          <span className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] ${
                            ev.status === 'อนุมัติ'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ev.status === 'ส่งกลับแก้ไข'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {translateEvaluationStatus(ev.status)}
                          </span>
                        </div>
                        {comments && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 rounded-lg p-2 leading-relaxed">
                            {comments}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Selector: 3 options */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800">
              เลือกมติของผู้ดูแลระบบ <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAction('approve')
                  setError('')
                }}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  action === 'approve'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                  action === 'approve' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </span>
                <span className="font-extrabold text-xs">อนุมัติโครงการ</span>
                <span className="text-[10px] text-slate-500">ผ่านการรับรอง</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAction('send_back')
                  setError('')
                }}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  action === 'send_back'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                  action === 'send_back' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <FileEdit className="w-4 h-4 stroke-[2.5]" />
                </span>
                <span className="font-extrabold text-xs">ส่งกลับแก้ไข</span>
                <span className="text-[10px] text-slate-500">ให้ปรับปรุงเอกสาร</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAction('reject')
                  setError('')
                }}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  action === 'reject'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                  action === 'reject' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <X className="w-4 h-4 stroke-[2.5]" />
                </span>
                <span className="font-extrabold text-xs">ไม่อนุมัติโครงการ</span>
                <span className="text-[10px] text-slate-500">ไม่ผ่านเกณฑ์</span>
              </button>
            </div>
          </div>

          {/* Dynamic Action Details */}
          {action === 'approve' && (
            <div className="p-3.5 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-2 font-extrabold text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ยืนยันการอนุมัติรับรองจริยธรรม</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800/90">
                โครงการจะเปลี่ยนสถานะเป็น <strong>&quot;อนุมัติ&quot;</strong> โดยสมบูรณ์ นักวิจัยสามารถดาวน์โหลดรายงานผลและดำเนินการวิจัยต่อไปได้ทันที
              </p>
            </div>
          )}

          {action === 'send_back' && (
            <div className="space-y-3 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80">
              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-amber-900">
                  ระบุข้อเสนอแนะหรือประเด็นที่ต้องแก้ไข <span className="text-rose-600">*</span>
                </label>
                <Textarea
                  rows={3}
                  required
                  placeholder="ระบุข้อแนะนำ สิ่งที่ต้องปรับปรุงแก้ไขในเล่มโครงร่างวิจัย..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold mb-1 text-amber-900">
                  แนบไฟล์ข้อเสนอแนะ / เล่มที่ตรวจแก้ (ถ้ามี)
                </label>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                  className="cursor-pointer text-xs rounded-xl bg-white border-amber-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                />
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                ℹ️ โครงการจะเปลี่ยนสถานะเป็น <strong>&quot;ส่งกลับแก้ไข&quot;</strong> ให้นักวิจัยสามารถอัปโหลดเล่มที่แก้ไขแล้วมายื่นใหม่อีกครั้ง
              </p>
            </div>
          )}

          {action === 'reject' && (
            <div className="space-y-3 p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/80">
              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-rose-900">
                  ระบุเหตุผลในการไม่อนุมัติ <span className="text-rose-600">*</span>
                </label>
                <Textarea
                  rows={3}
                  required
                  placeholder="ระบุเหตุผลที่ไม่ผ่านความเห็นชอบตามเกณฑ์จริยธรรม..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                ⚠️ เมื่อยืนยันไม่อนุมัติ โครงการจะเปลี่ยนสถานะเป็น <strong>&quot;ไม่อนุมัติ&quot;</strong> และระบบจะแสดงเหตุผลนี้ให้นักวิจัยรับทราบ
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full text-xs font-bold"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={submitting || ((action === 'reject' || action === 'send_back') && !reason.trim())}
              className={`rounded-full text-xs font-extrabold text-white border-none shadow-xs transition ${
                action === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : action === 'send_back'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submitting
                ? 'กำลังบันทึก...'
                : action === 'approve'
                ? 'ยืนยันอนุมัติโครงการ'
                : action === 'send_back'
                ? 'ยืนยันส่งกลับแก้ไข'
                : 'ยืนยันไม่อนุมัติโครงการ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

