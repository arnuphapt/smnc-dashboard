import React from 'react'
import { Clock, CheckCircle, XCircle, HelpCircle, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Tone = 'pending' | 'active' | 'warning' | 'success' | 'danger' | 'neutral'

// Single source of truth for status → color mapping, used by every screen
// (admin tables and the teacher-facing Clinic/Ethics/IP pages) so the same
// status always reads the same way no matter where it's encountered.
const STATUS_MAP: Record<string, { tone: Tone; label: string }> = {
  pending: { tone: 'pending', label: 'รอการยืนยัน' },
  confirmed: { tone: 'success', label: 'ยืนยันแล้ว' },
  cancelled: { tone: 'danger', label: 'ยกเลิก' },
  completed: { tone: 'active', label: 'เสร็จสิ้น' },

  ยื่นแล้ว: { tone: 'neutral', label: 'ยื่นแล้ว' },
  ยื่นคำขอ: { tone: 'neutral', label: 'ยื่นคำขอ' },
  กำลังตรวจ: { tone: 'warning', label: 'กำลังตรวจ' },
  กำลังตรวจสอบ: { tone: 'warning', label: 'กำลังตรวจสอบ' },
  รอแก้ไข: { tone: 'pending', label: 'รอแก้ไข' },
  รอเอกสารเพิ่ม: { tone: 'pending', label: 'รอเอกสารเพิ่ม' },
  อนุมัติ: { tone: 'success', label: 'อนุมัติ' },
  ไม่อนุมัติ: { tone: 'danger', label: 'ไม่อนุมัติ' },
}

const TONE_STYLE: Record<Tone, { bg: string; color: string; border: string }> = {
  pending: { bg: '#FFF8EC', color: '#B45309', border: '#B4530922' },
  active: { bg: '#EFF6FF', color: '#1E40AF', border: '#1E40AF22' },
  warning: { bg: '#F5F3FF', color: '#6D28D9', border: '#6D28D922' },
  success: { bg: '#ECFDF5', color: '#065F46', border: '#065F4622' },
  danger: { bg: '#FFF1F2', color: '#9F1239', border: '#9F123922' },
  neutral: { bg: '#F8FAFC', color: '#475569', border: '#47556922' },
}

const TONE_ICON: Record<Tone, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  active: <CheckCircle className="w-3.5 h-3.5" />,
  warning: <Clock className="w-3.5 h-3.5 animate-pulse" />,
  success: <CheckCircle className="w-3.5 h-3.5" />,
  danger: <XCircle className="w-3.5 h-3.5" />,
  neutral: <HelpCircle className="w-3.5 h-3.5" />,
}

export const isPendingStatus = (status: string): boolean => STATUS_MAP[status]?.tone === 'pending'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const entry = STATUS_MAP[status] ?? { tone: 'neutral' as Tone, label: status }
  const style = TONE_STYLE[entry.tone]
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'

  return (
    <Badge
      variant="outline"
      className={`h-auto gap-1.5 rounded-full font-bold ${padding}`}
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      {size === 'md' && TONE_ICON[entry.tone]}
      {entry.label}
    </Badge>
  )
}

export const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  const entry = STATUS_MAP[status] ?? { tone: 'neutral' as Tone, label: status }
  return <span style={{ color: TONE_STYLE[entry.tone].color }}><AlertCircle className="w-4 h-4" /></span>
}
