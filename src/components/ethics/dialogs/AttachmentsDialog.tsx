'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EthicsSubmission, EthicsAttachment } from '@/types/ethics'

interface AttachmentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: EthicsSubmission | null
  attachments: EthicsAttachment[]
  onDownloadFile: (fileUrl: string) => Promise<void>
}

const PdfIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <text x="5" y="16.5" fontSize="6.5" fontWeight="900" fill="currentColor" stroke="none" fontFamily="sans-serif">PDF</text>
  </svg>
)

export const AttachmentsDialog: React.FC<AttachmentsDialogProps> = ({
  open,
  onOpenChange,
  submission,
  attachments,
  onDownloadFile,
}) => {
  if (!submission) return null

  const subAttach = attachments.filter((a) => a.submission_id === submission.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.15em] text-[#64748B]">
            เอกสารแนบ ({subAttach.length} ไฟล์)
          </p>
          <DialogTitle className="header-display text-sm font-black text-[#0F172A] line-clamp-2 leading-relaxed" title={submission.project_title}>
            {submission.project_title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-2">
          {subAttach.length === 0 ? (
            <p className="text-xs font-semibold text-[#94A3B8]">ไม่มีเอกสารแนบ</p>
          ) : (
            subAttach.map((at) => (
              <button
                key={at.id}
                type="button"
                onClick={() => onDownloadFile(at.file_url)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer shadow-xs text-left"
              >
                <PdfIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{at.file_name || 'เอกสาร PDF'}</span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

