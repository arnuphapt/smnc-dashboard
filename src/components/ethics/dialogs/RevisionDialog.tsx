'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle, UploadCloud, FileCheck, FileText, X } from 'lucide-react'
import { EthicsSubmission } from '@/types/ethics'

interface RevisionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: EthicsSubmission | null
  currentUserId?: string
  onSuccess: () => void
}

const inputBase = "w-full text-sm px-4 py-2.5 rounded-2xl focus:outline-none transition-all duration-200"
const inputSty = { border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A' }

export const RevisionDialog: React.FC<RevisionDialogProps> = ({
  open,
  onOpenChange,
  submission,
  currentUserId,
  onSuccess,
}) => {
  const supabase = createClient()
  const [fileEC08, setFileEC08] = useState<File | null>(null)
  const [revisedFiles, setRevisedFiles] = useState<File[]>([])
  const [revisionNotes, setRevisionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (open) {
      setFileEC08(null)
      setRevisedFiles([])
      setRevisionNotes('')
      setError('')
      setSuccess('')
      setSubmitting(false)
    }
  }, [open, submission])

  if (!submission) return null

  const handleAddRevisedFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const added = Array.from(e.target.files)
      setRevisedFiles((prev) => [...prev, ...added])
      e.target.value = ''
    }
  }

  const removeRevisedFile = (index: number) => {
    setRevisedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !submission) return
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!fileEC08) {
      setError('กรุณาแนบไฟล์ "SMNC EC 08 ตารางการปรับแก้ไขโครงร่างการวิจัยตามข้อเสนอแนะของผู้ทรงคุณวุฒิ"')
      setSubmitting(false)
      return
    }

    if (revisedFiles.length === 0) {
      setError('กรุณาแนบไฟล์ "เอกสารฉบับแก้ไข"')
      setSubmitting(false)
      return
    }

    try {
      const filesToUpload: { file: File; customName: string }[] = []
      if (fileEC08) {
        filesToUpload.push({
          file: fileEC08,
          customName: `[SMNC EC 08] ${fileEC08.name}`,
        })
      }
      revisedFiles.forEach((file) => {
        filesToUpload.push({
          file,
          customName: `[ฉบับแก้ไข] ${file.name}`,
        })
      })

      const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
      for (const item of filesToUpload) {
        if (item.file.size > MAX_FILE_SIZE) {
          throw new Error(`ไฟล์ "${item.file.name}" มีขนาดใหญ่เกินกำหนด (${(item.file.size / (1024 * 1024)).toFixed(1)} MB) ขนาดสูงสุดที่รองรับคือ 50 MB ต่อไฟล์`)
        }
      }

      for (let i = 0; i < filesToUpload.length; i++) {
        const { file, customName } = filesToUpload[i]
        const extIndex = file.name.lastIndexOf('.')
        const ext = extIndex !== -1 ? file.name.substring(extIndex) : ''
        const base = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name
        const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, '_')
        const safeName = /[a-zA-Z0-9]/.test(sanitizedBase) ? sanitizedBase : 'doc'
        const storagePath = `ethics/${currentUserId}/revised_${Date.now()}_${i}_${safeName}${ext}`

        const { error: uploadError } = await supabase.storage.from('wisdom-private').upload(storagePath, file)
        if (uploadError) throw uploadError
        const { error: attachError } = await supabase.from('ethics_attachments').insert({
          submission_id: submission.id,
          file_url: storagePath,
          file_name: customName,
          file_type: file.type,
        })
        if (attachError) throw attachError
      }

      const timestamp = new Date().toLocaleString('th-TH')
      const appendedNote = `\n\n[ระบบ: ผู้ยื่นส่งเล่มปรับปรุงใหม่เมื่อ ${timestamp}]\nบันทึกแก้ไขของผู้ยื่น: ${revisionNotes.trim() || 'ไม่มีระบุ'}\n-----------------------------------\n`
      const newReviewerNotes = (submission.reviewer_notes || '') + appendedNote

      const { error: updateError } = await supabase
        .from('ethics_submissions')
        .update({
          status: 'ยื่นแล้ว',
          reviewer_notes: newReviewerNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id)

      if (updateError) throw updateError

      setSuccess('ยื่นฉบับแก้ไขเรียบร้อยแล้ว!')
      setTimeout(() => {
        onOpenChange(false)
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#00796B]">
            ยื่นฉบับแก้ไข
          </p>
          <DialogTitle className="header-display text-base font-black text-[#0F172A]">
            ส่งเล่มโครงร่างวิจัยฉบับแก้ไข
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs font-semibold text-[#64748B]">
              แนบตารางการปรับแก้ไขตามข้อเสนอแนะ (SMNC EC 08) และเล่มเอกสารฉบับแก้ไขเพื่อส่งให้คณะกรรมการพิจารณาอีกครั้ง
            </p>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-extrabold bg-[#FFF0ED] text-[#EF6C4A] border border-[#FF8A6A]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-extrabold bg-[#EBFBEE] text-[#27AE60] border border-[#A3E2B6]">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">ชื่อโครงร่างวิจัย</label>
                <Input
                  type="text"
                  disabled
                  value={submission.project_title}
                  className="w-full text-xs px-4 py-2.5 rounded-2xl bg-[#F8FAFC] text-[#64748B] cursor-not-allowed"
                  style={inputSty}
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">
                  บันทึกแจ้งการแก้ไข / สรุปรายการแก้ *
                </label>
                <Textarea
                  rows={3}
                  required
                  placeholder="ระบุรายการจุดที่ปรับแก้ เช่น แก้ไขตามข้อเสนอแนะใน SMNC EC 08 เรียบร้อยแล้ว..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className={inputBase + ' resize-none'}
                  style={inputSty}
                />
              </div>

              {/* 2 UPLOAD SLOTS FOR REVISION */}
              <div className="space-y-3 pt-1">
                <div className="border-b border-slate-200 pb-1.5">
                  <label className="block text-xs font-black text-[#0F172A] uppercase tracking-wider">
                    เอกสารแนบฉบับแก้ไข (2 รายการ)
                  </label>
                  <p className="text-[10px] text-[#64748B] font-semibold mt-0.5">
                    รองรับไฟล์ PDF, Word (.doc, .docx) — ขนาดสูงสุดไม่เกิน 50 MB ต่อไฟล์
                  </p>
                </div>

                {/* SLOT 1: SMNC EC 08 */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    fileEC08
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                      <span className="px-2.5 py-1 rounded-xl bg-[#E8F6F5] text-[#00796B] border border-[#BCE5E2] font-mono text-[11px] font-black shrink-0">
                        SMNC EC 08
                      </span>
                      <span className="text-xs font-extrabold text-[#0F172A] leading-snug">
                        ตารางการปรับแก้ไขโครงร่างการวิจัยตามข้อเสนอแนะของผู้ทรงคุณวุฒิ <span className="text-rose-600">*</span>
                      </span>
                    </div>

                    {!fileEC08 ? (
                      <label
                        htmlFor="slot-ec-08"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-[#00796B] bg-white border border-[#BCE5E2] hover:bg-[#E8F6F5] cursor-pointer transition shadow-2xs shrink-0 self-start sm:self-center"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>เลือกไฟล์</span>
                        <input
                          id="slot-ec-08"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) setFileEC08(f)
                            e.target.value = ''
                          }}
                        />
                      </label>
                    ) : null}
                  </div>

                  {fileEC08 && (
                    <div className="mt-2.5 flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate" title={fileEC08.name}>
                          {fileEC08.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          ({(fileEC08.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFileEC08(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="ลบไฟล์นี้"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* SLOT 2: เอกสารฉบับแก้ไข (แนบได้หลายไฟล์) */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    revisedFiles.length > 0
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 font-mono text-[11px] font-black shrink-0">
                        ฉบับแก้ไข
                      </span>
                      <div>
                        <span className="text-xs font-extrabold text-[#0F172A] leading-snug block">
                          เอกสารฉบับแก้ไข (แนบได้หลายไฟล์) <span className="text-rose-600">*</span>
                        </span>
                        <span className="text-[10px] text-[#64748B] font-medium block">
                          เช่น เล่มโครงร่างวิจัยที่ปรับแก้, แบบชี้แจงยินยอมฉบับแก้ไข, เครื่องมือวิจัย ฯลฯ
                        </span>
                      </div>
                    </div>

                    <label
                      htmlFor="slot-revised-files"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer transition shadow-2xs shrink-0 self-start sm:self-center"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                      <span>เลือกไฟล์ (หลายไฟล์)</span>
                      <input
                        id="slot-revised-files"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleAddRevisedFiles}
                      />
                    </label>
                  </div>

                  {revisedFiles.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {revisedFiles.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-800 truncate" title={f.name}>
                              {f.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRevisedFile(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="ลบไฟล์นี้"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 h-auto rounded-full text-xs font-extrabold disabled:opacity-50 btn-primary cursor-pointer"
              >
                {submitting ? 'กำลังอัปโหลดเอกสารแก้ไข...' : 'ยื่นฉบับแก้ไข →'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

