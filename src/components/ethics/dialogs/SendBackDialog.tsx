'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileEdit, AlertCircle } from 'lucide-react'
import { EthicsSubmission } from '@/types/ethics'

interface SendBackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: EthicsSubmission | null
  currentUserId?: string
  onSuccess: () => void
  triggerAlert: (title: string, description: string, variant?: 'primary' | 'danger' | 'warning') => void
}

const inputBase = "w-full text-sm px-4 py-2.5 rounded-2xl focus:outline-none transition-all duration-200"
const inputSty = { border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A' }

export const SendBackDialog: React.FC<SendBackDialogProps> = ({
  open,
  onOpenChange,
  submission,
  currentUserId,
  onSuccess,
  triggerAlert,
}) => {
  const supabase = createClient()
  const [reason, setReason] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
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
      if (files && files.length > 0) {
        const MAX_FILE_SIZE = 50 * 1024 * 1024
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`ไฟล์ "${file.name}" มีขนาดใหญ่เกิน 50 MB`)
          }
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

      const timestamp = new Date().toLocaleString('th-TH')
      let newReviewerNotes = submission.reviewer_notes || ''
      if (reason.trim()) {
        const appendedNote = `\n\n[ระบบ: ส่งกลับแก้ไขเมื่อ ${timestamp}]\nเหตุผล/ข้อเสนอแนะ: ${reason.trim()}\n-----------------------------------\n`
        newReviewerNotes = newReviewerNotes + appendedNote
      }

      const { error: statusError } = await supabase
        .from('ethics_submissions')
        .update({
          status: 'ส่งกลับแก้ไข',
          reviewer_notes: newReviewerNotes || submission.reviewer_notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', submission.id)

      if (statusError) throw statusError

      onOpenChange(false)
      onSuccess()
      triggerAlert('สำเร็จ', 'ส่งกลับให้ผู้ยื่นแก้ไขเรียบร้อยแล้ว', 'primary')
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งกลับแก้ไข')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#E2E8F0] bg-[#FFFBEB] shrink-0">
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#B45309]">
            ส่งกลับแก้ไข
          </p>
          <DialogTitle className="header-display text-base font-black text-[#0F172A] flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-amber-600" />
            ส่งข้อเสนอโครงการกลับไปแก้ไข
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs font-semibold text-[#64748B]">
              ระบุเหตุผลหรือข้อเสนอแนะเพิ่มเติมที่ต้องการให้ผู้วิจัยปรับปรุงแก้ไข พร้อมทั้งแนบเอกสารคำแนะนำ (ถ้ามี)
            </p>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-extrabold bg-[#FFF0ED] text-[#EF6C4A] border border-[#FF8A6A]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
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
                  เหตุผล / ข้อเสนอแนะในการแก้ไข <span className="font-normal text-[#64748B]">(ถ้ามี)</span>
                </label>
                <Textarea
                  rows={4}
                  placeholder="ระบุข้อชี้แจงหรือประเด็นที่ต้องแก้ไขเพิ่มเติม เพื่อให้นักวิจัยรับทราบ..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={inputBase + ' resize-none'}
                  style={inputSty}
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">
                  แนบไฟล์เอกสารคำแนะนำ <span className="font-normal text-[#64748B]">(ถ้ามี, เลือกได้หลายไฟล์)</span>
                </label>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg"
                  onChange={(e) => setFiles(e.target.files)}
                  className={inputBase + ' h-auto'}
                  style={inputSty}
                />
                <p className="text-[10px] mt-1 text-[#64748B] font-semibold">รองรับไฟล์ PDF, Word, รูปภาพ — ขนาดสูงสุดไม่เกิน 50 MB ต่อไฟล์</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-[#E2E8F0]">
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
                disabled={submitting}
                className="btn-primary rounded-full text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white border-none"
              >
                {submitting ? 'กำลังส่งกลับแก้ไข...' : 'ยืนยันส่งกลับแก้ไข'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

