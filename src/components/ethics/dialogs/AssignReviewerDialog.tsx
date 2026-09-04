'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { EthicsSubmission } from '@/types/ethics'
import { Profile } from '@/context/AuthContext'
import { formatUserRolesText } from '@/utils/roleHelper'

interface AssignReviewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: EthicsSubmission | null
  expertProfiles: Profile[]
  onAssign: (subId: string, reviewerId: string | null, reviewerId2: string | null) => Promise<void>
  triggerAlert: (title: string, description: string, variant?: 'primary' | 'danger' | 'warning') => void
}

export const AssignReviewerDialog: React.FC<AssignReviewerDialogProps> = ({
  open,
  onOpenChange,
  submission,
  expertProfiles,
  onAssign,
  triggerAlert,
}) => {
  const [assignReviewerId, setAssignReviewerId] = useState<string>('')
  const [assignReviewerId2, setAssignReviewerId2] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && submission) {
      setAssignReviewerId(submission.assigned_reviewer_id || '')
      setAssignReviewerId2(submission.assigned_reviewer_id_2 || '')
      setSubmitting(false)
    }
  }, [open, submission])

  if (!submission) return null

  const handleSave = async () => {
    if (assignReviewerId && assignReviewerId2 && assignReviewerId === assignReviewerId2) {
      triggerAlert('เกิดข้อผิดพลาด', 'กรุณาเลือกผู้ทรงคุณวุฒิ 2 ท่านไม่ให้ซ้ำกัน', 'danger')
      return
    }
    setSubmitting(true)
    try {
      await onAssign(submission.id, assignReviewerId || null, assignReviewerId2 || null)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const expertOptions = [
    { value: '', label: '— ยังไม่ได้มอบหมาย —' },
    ...expertProfiles.map((p) => ({
      value: p.id,
      label: `${p.full_name || p.email} (${formatUserRolesText(p.role)}${(p as any).is_temp_account ? ' · บัญชีชั่วคราว' : ''})`,
      sublabel: p.full_name ? p.email : undefined,
    }))
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <div>
            <label className="block text-[11px] font-bold text-[#64748B]">ชื่อโครงร่างวิจัย</label>
            <p className="font-extrabold text-[#0F172A] mt-0.5 text-xs">{submission.project_title}</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0F172A] mb-1.5">ผู้ทรงคุณวุฒิท่านที่ 1</label>
            <SearchableSelect
              value={assignReviewerId}
              onValueChange={(val) => setAssignReviewerId(val)}
              placeholder="เลือกผู้ทรงคุณวุฒิ..."
              searchPlaceholder="พิมพ์ชื่อ หรือ อีเมล เพื่อค้นหา..."
              options={expertOptions}
              triggerClassName="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0F172A] mb-1.5">ผู้ทรงคุณวุฒิท่านที่ 2 (ถ้ามี)</label>
            <SearchableSelect
              value={assignReviewerId2}
              onValueChange={(val) => setAssignReviewerId2(val)}
              placeholder="เลือกผู้ทรงคุณวุฒิ..."
              searchPlaceholder="พิมพ์ชื่อ หรือ อีเมล เพื่อค้นหา..."
              options={expertOptions}
              triggerClassName="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-2xl"
            />

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
              onClick={() => onOpenChange(false)}
              className="rounded-full text-xs font-bold"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="btn-primary rounded-full text-xs font-extrabold"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการมอบหมาย'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

