'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle } from 'lucide-react'
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
  const [revisionFiles, setRevisionFiles] = useState<FileList | null>(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (open) {
      setRevisionFiles(null)
      setRevisionNotes('')
      setError('')
      setSuccess('')
      setSubmitting(false)
    }
  }, [open, submission])

  if (!submission) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !submission) return
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!revisionFiles || revisionFiles.length === 0) {
      setError('กรุณาอัปโหลดเอกสารปรับปรุงแก้ไข')
      setSubmitting(false)
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
        const storagePath = `ethics/${currentUserId}/revised_${Date.now()}_${safeName}${ext}`

        const { error: uploadError } = await supabase.storage.from('wisdom-private').upload(storagePath, file)
        if (uploadError) throw uploadError
        const { error: attachError } = await supabase.from('ethics_attachments').insert({
          submission_id: submission.id,
          file_url: storagePath,
          file_name: `[ฉบับแก้ไข] ${file.name}`,
          file_type: file.type
        })
        if (attachError) throw attachError
      }

      const timestamp = new Date().toLocaleString('th-TH')
      const appendedNote = `\n\n[ระบบ: ผู้ยื่นส่งเล่มปรับปรุงใหม่เมื่อ ${timestamp}]\nบันทึกแก้ไขของผู้ยื่น: ${revisionNotes.trim() || 'ไม่มีระบุ'}\n-----------------------------------\n`
      const newReviewerNotes = (submission.reviewer_notes || '') + appendedNote

      const { error: updateError } = await supabase.from('ethics_submissions').update({
        status: 'ยื่นแล้ว',
        reviewer_notes: newReviewerNotes,
        updated_at: new Date().toISOString()
      }).eq('id', submission.id)

      if (updateError) throw updateError

      setSuccess('ยื่นเล่มเอกสารปรับปรุงเรียบร้อยแล้ว!')
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
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#64748B]">แก้ไขส่งปรับปรุง</p>
          <DialogTitle className="header-display text-base font-black text-[#0F172A]">
            ส่งเล่มโครงร่างวิจัยฉบับแก้ไข
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs font-semibold text-[#64748B]">
              อัปโหลดไฟล์เล่มเสนอแนะปรับปรุง หรือเอกสารเพิ่มเติมตามคำแนะนำของผู้ทรงคุณวุฒิ
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
                <Input type="text" disabled value={submission.project_title} className="w-full text-xs px-4 py-2.5 rounded-2xl bg-[#F8FAFC] text-[#64748B] cursor-not-allowed" style={inputSty} />
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
              disabled={submitting}
              className="w-full py-2.5 h-auto rounded-full text-xs font-extrabold disabled:opacity-50 mt-2 btn-primary"
            >
              {submitting ? 'กำลังอัปโหลดเอกสารแก้ไข...' : 'ยืนยันส่งเอกสารปรับปรุง →'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

