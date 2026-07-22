import React from 'react'
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  Search,
  AlertTriangle,
  Send,
  FileEdit,
  Tag,
  Ban,
  Check,
  FileSearch,
  Hourglass,
  Shield,
  UserCheck,
  User,
  Users,
  Lock,
  Globe,
  Award,
  BookOpen,
  Lightbulb,
  FileText,
  Package,
  Cpu,
  Code,
  Laptop,
  Sparkles,
  Layers,
  GraduationCap,
  HeartHandshake,
  FlaskConical,
  Building2,
  MapPin,
  MoreHorizontal,
  MinusCircle,
  Loader2,
  CheckSquare,
  FileUp,
  BookMarked
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export type Tone =
  | 'submitted'       // ยื่นแล้ว / เอกสาร / ได้เลขคำขอ / ส่งออก (Sky Blue)
  | 'reviewing'       // กำลังตรวจ / กำลังดำเนินการ (Violet)
  | 'action_required' // รอแก้ไข (Orange)
  | 'pending'         // รอการยืนยัน (Amber)
  | 'success'         // อนุมัติ / ขึ้นทะเบียนแล้ว / ดำเนินการแล้ว (Emerald)
  | 'danger'          // ไม่อนุมัติ / ไม่ได้ดำเนินการ (Rose)
  | 'navy'            // ผู้ดูแลระบบ / หัวหน้า (Navy)
  | 'cyan'            // สิ่งประดิษฐ์ / อนุสิทธิบัตร (Cyan)
  | 'teal'            // ปฐมภูมิ / บุคลากร (Teal)
  | 'indigo'          // ผลิตภัณฑ์ / นักศึกษา (Indigo)
  | 'purple'          // วรรณกรรม / ลิขสิทธิ์ / นานาชาติ (Purple)
  | 'slate'           // อื่นๆ / ปิดใช้งาน (Slate)

interface StatusConfig {
  tone: Tone
  label: string
  icon?: React.ReactNode
}

// Single source of truth for exact status values across SMNC Dashboard
const EXACT_STATUS_MAP: Record<string, StatusConfig> = {
  // English status & role mappings
  pending: { tone: 'pending', label: 'รอการยืนยัน' },
  confirmed: { tone: 'success', label: 'ยืนยันแล้ว' },
  cancelled: { tone: 'danger', label: 'ยกเลิก' },
  completed: { tone: 'success', label: 'เสร็จสิ้น' },
  approved: { tone: 'success', label: 'อนุมัติแล้ว' },
  rejected: { tone: 'danger', label: 'ไม่อนุมัติ' },
  active: { tone: 'success', label: 'เปิดใช้งาน' },
  inactive: { tone: 'slate', label: 'ปิดใช้งาน' },
  public: { tone: 'submitted', label: 'สาธารณะ' },
  private: { tone: 'pending', label: 'ส่วนตัว' },

  admin: { tone: 'navy', label: 'ผู้ดูแลระบบ (Admin)' },
  expert: { tone: 'reviewing', label: 'ผู้ทรงคุณวุฒิ' },
  teacher: { tone: 'teal', label: 'อาจารย์ / บุคลากร' },
  'ผู้ดูแลระบบ': { tone: 'navy', label: 'ผู้ดูแลระบบ (Admin)' },
  'ผู้ทรงคุณวุฒิ': { tone: 'reviewing', label: 'ผู้ทรงคุณวุฒิ' },
  'อาจารย์': { tone: 'teal', label: 'อาจารย์ / บุคลากร' },
  'อาจารย์ / บุคลากร': { tone: 'teal', label: 'อาจารย์ / บุคลากร' },

  // Registration & Application specific statuses
  'ได้รับการขึ้นทะเบียนแล้ว': { tone: 'success', label: 'ได้รับการขึ้นทะเบียนแล้ว' },
  'ขึ้นทะเบียนแล้ว': { tone: 'success', label: 'ขึ้นทะเบียนแล้ว' },
  'ได้เลขคำขอ': { tone: 'submitted', label: 'ได้เลขคำขอ' },
  'ส่งออกจากวิทยาลัย': { tone: 'submitted', label: 'ส่งออกจากวิทยาลัย' },
  'ยื่นแล้ว': { tone: 'submitted', label: 'ยื่นแล้ว' },
  'ยื่นคำขอ': { tone: 'submitted', label: 'ยื่นคำขอ' },
  'ยื่นเรื่องแล้ว': { tone: 'submitted', label: 'ยื่นเรื่องแล้ว' },
  'ส่งคำขอแล้ว': { tone: 'submitted', label: 'ส่งคำขอแล้ว' },
  'ส่งเอกสารออก': { tone: 'submitted', label: 'ส่งเอกสารออก' },

  'กำลังตรวจ': { tone: 'reviewing', label: 'กำลังตรวจ' },
  'กำลังตรวจสอบ': { tone: 'reviewing', label: 'กำลังตรวจสอบ' },
  'อยู่ระหว่างพิจารณา': { tone: 'reviewing', label: 'อยู่ระหว่างพิจารณา' },
  'อยู่ระหว่างการประเมิน': { tone: 'reviewing', label: 'อยู่ระหว่างการประเมิน' },
  'อยู่ระหว่างดำเนินการ': { tone: 'reviewing', label: 'อยู่ระหว่างดำเนินการ' },

  'รอแก้ไข': { tone: 'action_required', label: 'รอแก้ไข' },
  'รอเอกสารเพิ่ม': { tone: 'action_required', label: 'รอเอกสารเพิ่ม' },
  'ส่งกลับแก้ไข': { tone: 'action_required', label: 'ส่งกลับแก้ไข' },
  'แก้ไขแล้ว': { tone: 'reviewing', label: 'แก้ไขแล้ว' },

  'รอการยืนยัน': { tone: 'pending', label: 'รอการยืนยัน' },
  'รออนุมัติ': { tone: 'pending', label: 'รออนุมัติ' },
  'รอพิจารณา': { tone: 'pending', label: 'รอพิจารณา' },

  'อนุมัติ': { tone: 'success', label: 'อนุมัติ' },
  'อนุมัติแล้ว': { tone: 'success', label: 'อนุมัติแล้ว' },
  'ผ่าน': { tone: 'success', label: 'ผ่าน' },
  'ผ่านการอนุมัติ': { tone: 'success', label: 'ผ่านการอนุมัติ' },
  'รับรองแล้ว': { tone: 'success', label: 'รับรองแล้ว' },
  'จดทะเบียนแล้ว': { tone: 'success', label: 'จดทะเบียนแล้ว' },
  'เปิดใช้งาน': { tone: 'success', label: 'เปิดใช้งาน' },

  'ไม่อนุมัติ': { tone: 'danger', label: 'ไม่อนุมัติ' },
  'ไม่อนุมัติ/ไม่ผ่าน': { tone: 'danger', label: 'ไม่ผ่าน' },
  'ไม่ผ่าน': { tone: 'danger', label: 'ไม่ผ่าน' },
  'ปฏิเสธ': { tone: 'danger', label: 'ปฏิเสธ' },
  'ยกเลิก': { tone: 'danger', label: 'ยกเลิก' },
  'ปิดใช้งาน': { tone: 'slate', label: 'ปิดใช้งาน' },

  // Execution States (การดำเนินงาน)
  'ดำเนินการแล้ว': { tone: 'success', label: 'ดำเนินการแล้ว' },
  'กำลังดำเนินการ': { tone: 'reviewing', label: 'กำลังดำเนินการ' },
  'ไม่ได้ดำเนินการ': { tone: 'danger', label: 'ไม่ได้ดำเนินการ' },
  'ยังไม่ดำเนินการ': { tone: 'slate', label: 'ยังไม่ดำเนินการ' },

  // Deliverables & Literature Types (ประเภทชิ้นงาน/วรรณกรรม)
  'วรรณกรรม': { tone: 'purple', label: 'วรรณกรรม' },
  'วรรณกรรม ประเภทงานนิพนธ์': { tone: 'purple', label: 'วรรณกรรม ประเภทงานนิพนธ์' },
  'งานนิพนธ์': { tone: 'purple', label: 'งานนิพนธ์' },
  'ผลิตภัณฑ์': { tone: 'indigo', label: 'ผลิตภัณฑ์' },
  'สิ่งประดิษฐ์': { tone: 'cyan', label: 'สิ่งประดิษฐ์' },
  'เอกสาร/แบบประเมิน': { tone: 'submitted', label: 'เอกสาร/แบบประเมิน' },
  'เอกสาร': { tone: 'submitted', label: 'เอกสาร' },
  'ซอฟต์แวร์': { tone: 'submitted', label: 'ซอฟต์แวร์' },
  'แอปพลิเคชัน': { tone: 'submitted', label: 'แอปพลิเคชัน' },

  // Scopes & Care Levels
  'ปฐมภูมิ': { tone: 'teal', label: 'ปฐมภูมิ' },
  'ทุติยภูมิ': { tone: 'submitted', label: 'ทุติยภูมิ' },
  'ตติยภูมิ': { tone: 'purple', label: 'ตติยภูมิ' },
  'ระดับชาติ': { tone: 'indigo', label: 'ระดับชาติ' },
  'นานาชาติ': { tone: 'purple', label: 'นานาชาติ' },
  'ระดับสถาบัน': { tone: 'navy', label: 'ระดับสถาบัน' },
  'ภายในสถาบัน': { tone: 'navy', label: 'ภายในสถาบัน' },
  'ระดับจังหวัด': { tone: 'teal', label: 'ระดับจังหวัด' },
  'ระดับภูมิภาค': { tone: 'cyan', label: 'ระดับภูมิภาค' },

  // Functions & Domains
  'กิจการนักศึกษา': { tone: 'indigo', label: 'กิจการนักศึกษา' },
  'การเรียนการสอน': { tone: 'purple', label: 'การเรียนการสอน' },
  'บริการวิชาการ': { tone: 'teal', label: 'บริการวิชาการ' },
  'การวิจัย': { tone: 'submitted', label: 'การวิจัย' },
  'หัวหน้าโครงการ': { tone: 'navy', label: 'หัวหน้าโครงการ' },
  'ผู้ร่วมวิจัย': { tone: 'teal', label: 'ผู้ร่วมวิจัย' },

  // IP Types
  'Petty Patent (อนุสิทธิบัตร)': { tone: 'cyan', label: 'อนุสิทธิบัตร' },
  'Copyright (ลิขสิทธิ์)': { tone: 'purple', label: 'ลิขสิทธิ์' },
  'Patent (สิทธิบัตร)': { tone: 'submitted', label: 'สิทธิบัตร' },
  'Trademark (เครื่องหมายการค้า)': { tone: 'pending', label: 'เครื่องหมายการค้า' },
  'Trade Secret (ความลับทางการค้า)': { tone: 'slate', label: 'ความลับทางการค้า' },
  'อนุสิทธิบัตร': { tone: 'cyan', label: 'อนุสิทธิบัตร' },
  'ลิขสิทธิ์': { tone: 'purple', label: 'ลิขสิทธิ์' },
  'สิทธิบัตร': { tone: 'submitted', label: 'สิทธิบัตร' },
  'เครื่องหมายการค้า': { tone: 'pending', label: 'เครื่องหมายการค้า' },

  // Journal Ranks
  'TCI 1': { tone: 'success', label: 'TCI 1' },
  'TCI กลุ่ม 1': { tone: 'success', label: 'TCI กลุ่ม 1' },
  'Scopus': { tone: 'purple', label: 'Scopus' },
  'TCI 2': { tone: 'submitted', label: 'TCI 2' },
  'TCI กลุ่ม 2': { tone: 'submitted', label: 'TCI กลุ่ม 2' },

  'อื่นๆ': { tone: 'slate', label: 'อื่นๆ' },
}

const TONE_STYLE: Record<Tone, { bg: string; color: string; border: string }> = {
  submitted: { bg: '#F0F9FF', color: '#0284C7', border: '#BAE6FD' },       // Sky Blue
  reviewing: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },       // Violet
  action_required: { bg: '#FFF7ED', color: '#C2410C', border: '#FFEDD5' }, // Orange
  pending: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },         // Amber
  success: { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },         // Emerald Green
  danger: { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' },          // Rose Red
  navy: { bg: '#0B1D3A', color: '#FFFFFF', border: '#1A3A5C' },            // Midnight Navy
  cyan: { bg: '#ECFEFF', color: '#0891B2', border: '#A5F3FC' },            // Cyan
  teal: { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' },            // Teal
  indigo: { bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },          // Indigo
  purple: { bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' },          // Purple
  slate: { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },           // Slate Gray
}

// Intelligent keyword resolution engine for any string value
const resolveStatusConfig = (statusKey: string): { tone: Tone; label: string; iconKey?: string } => {
  const trimmed = (statusKey || '').trim()
  if (EXACT_STATUS_MAP[trimmed]) {
    return { tone: EXACT_STATUS_MAP[trimmed].tone, label: EXACT_STATUS_MAP[trimmed].label }
  }

  // Keyword rules for unmapped dynamic strings
  if (trimmed.includes('ขึ้นทะเบียน')) return { tone: 'success', label: trimmed, iconKey: 'check-circle' }
  if (trimmed.includes('ได้เลขคำขอ')) return { tone: 'submitted', label: trimmed, iconKey: 'file-check' }
  if (trimmed.includes('ส่งออก')) return { tone: 'submitted', label: trimmed, iconKey: 'send' }
  if (trimmed.includes('วรรณกรรม') || trimmed.includes('งานนิพนธ์')) return { tone: 'purple', label: trimmed, iconKey: 'book-open' }
  if (trimmed.includes('ลิขสิทธิ์')) return { tone: 'purple', label: trimmed, iconKey: 'shield' }
  if (trimmed.includes('อนุสิทธิบัตร')) return { tone: 'cyan', label: trimmed, iconKey: 'cpu' }
  if (trimmed.includes('สิทธิบัตร')) return { tone: 'submitted', label: trimmed, iconKey: 'shield' }
  if (trimmed.includes('เครื่องหมายการค้า')) return { tone: 'pending', label: trimmed, iconKey: 'tag' }
  if (trimmed.includes('ผลิตภัณฑ์')) return { tone: 'indigo', label: trimmed, iconKey: 'package' }
  if (trimmed.includes('สิ่งประดิษฐ์')) return { tone: 'cyan', label: trimmed, iconKey: 'cpu' }

  if (trimmed.includes('ดำเนินการแล้ว') || trimmed.includes('เสร็จสิ้น') || trimmed.includes('สำเร็จ')) return { tone: 'success', label: trimmed, iconKey: 'check-circle' }
  if (trimmed.includes('กำลังดำเนินการ') || trimmed.includes('อยู่ระหว่าง')) return { tone: 'reviewing', label: trimmed, iconKey: 'loader' }
  if (trimmed.includes('ไม่ได้ดำเนินการ') || trimmed.includes('ยังไม่')) return { tone: 'danger', label: trimmed, iconKey: 'minus-circle' }

  if (trimmed.includes('ปฐมภูมิ')) return { tone: 'teal', label: trimmed, iconKey: 'sparkles' }
  if (trimmed.includes('ทุติยภูมิ') || trimmed.includes('ตติยภูมิ')) return { tone: 'purple', label: trimmed, iconKey: 'layers' }

  return { tone: 'slate', label: trimmed || 'ไม่ระบุ' }
}

const renderIcon = (statusKey: string, tone: Tone, iconSizeClass: string, iconKey?: string) => {
  if (iconKey === 'check-circle') return <CheckCircle2 className={`${iconSizeClass} shrink-0`} />
  if (iconKey === 'file-check') return <FileCheck className={`${iconSizeClass} shrink-0`} />
  if (iconKey === 'send') return <Send className={`${iconSizeClass} shrink-0`} />
  if (iconKey === 'book-open') return <BookOpen className={`${iconSizeClass} shrink-0`} />
  if (iconKey === 'shield') return <Shield className={`${iconSizeClass} shrink-0`} />
  if (iconKey === 'cpu') return <Cpu className={`${iconSizeClass} shrink-0`} />
  if (iconKey === 'package') return <Package className={`${iconSizeClass} shrink-0`} />
  if (iconKey === 'loader') return <Loader2 className={`${iconSizeClass} shrink-0 animate-spin`} />
  if (iconKey === 'minus-circle') return <MinusCircle className={`${iconSizeClass} shrink-0`} />
  if (iconKey === 'sparkles') return <Sparkles className={`${iconSizeClass} shrink-0`} />
  if (iconKey === 'layers') return <Layers className={`${iconSizeClass} shrink-0`} />

  // Specific status overrides
  if (statusKey.includes('ขึ้นทะเบียน')) return <CheckCircle2 className={`${iconSizeClass} shrink-0`} />
  if (statusKey.includes('ได้เลขคำขอ')) return <FileCheck className={`${iconSizeClass} shrink-0`} />
  if (statusKey.includes('ส่งออก')) return <Send className={`${iconSizeClass} shrink-0`} />
  if (statusKey.includes('วรรณกรรม') || statusKey.includes('งานนิพนธ์')) return <BookMarked className={`${iconSizeClass} shrink-0`} />

  if (statusKey === 'ดำเนินการแล้ว') return <CheckCircle2 className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'กำลังดำเนินการ') return <Loader2 className={`${iconSizeClass} shrink-0 animate-spin`} />
  if (statusKey === 'ไม่ได้ดำเนินการ' || statusKey === 'ยังไม่ดำเนินการ') return <MinusCircle className={`${iconSizeClass} shrink-0`} />

  if (statusKey === 'ผลิตภัณฑ์') return <Package className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'สิ่งประดิษฐ์') return <Cpu className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'เอกสาร/แบบประเมิน' || statusKey === 'เอกสาร') return <FileText className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'ซอฟต์แวร์' || statusKey === 'แอปพลิเคชัน') return <Code className={`${iconSizeClass} shrink-0`} />

  if (statusKey === 'ปฐมภูมิ') return <Sparkles className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'ทุติยภูมิ' || statusKey === 'ตติยภูมิ') return <Layers className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'กิจการนักศึกษา') return <GraduationCap className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'การเรียนการสอน') return <BookOpen className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'บริการวิชาการ') return <HeartHandshake className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'การวิจัย') return <FlaskConical className={`${iconSizeClass} shrink-0`} />

  if (statusKey === 'ระดับชาติ' || statusKey === 'นานาชาติ') return <Globe className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'ระดับสถาบัน' || statusKey === 'ภายในสถาบัน') return <Building2 className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'ระดับจังหวัด' || statusKey === 'ระดับภูมิภาค') return <MapPin className={`${iconSizeClass} shrink-0`} />
  if (statusKey === 'อื่นๆ') return <MoreHorizontal className={`${iconSizeClass} shrink-0`} />

  // General Tone Fallbacks
  switch (tone) {
    case 'submitted':
      return <FileCheck className={`${iconSizeClass} shrink-0`} />
    case 'reviewing':
      return <FileSearch className={`${iconSizeClass} shrink-0`} />
    case 'action_required':
      return <AlertTriangle className={`${iconSizeClass} shrink-0`} />
    case 'pending':
      return <Clock className={`${iconSizeClass} shrink-0`} />
    case 'success':
      return <CheckCircle2 className={`${iconSizeClass} shrink-0`} />
    case 'danger':
      return <XCircle className={`${iconSizeClass} shrink-0`} />
    case 'navy':
      return <Shield className={`${iconSizeClass} shrink-0`} />
    case 'cyan':
      return <Cpu className={`${iconSizeClass} shrink-0`} />
    case 'teal':
      return <Sparkles className={`${iconSizeClass} shrink-0`} />
    case 'indigo':
      return <Package className={`${iconSizeClass} shrink-0`} />
    case 'purple':
      return <BookMarked className={`${iconSizeClass} shrink-0`} />
    case 'slate':
    default:
      return <Tag className={`${iconSizeClass} shrink-0`} />
  }
}

export const isPendingStatus = (status: string): boolean => {
  const config = resolveStatusConfig(status)
  return config.tone === 'pending' || config.tone === 'submitted' || config.tone === 'reviewing' || config.tone === 'action_required'
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
  className?: string
  customLabel?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  className = '',
  customLabel
}) => {
  const resolved = resolveStatusConfig(status)
  const style = TONE_STYLE[resolved.tone]

  // Size styling for consistent typography across whole app
  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-0.5 text-xs font-bold tracking-tight'
    : 'px-3 py-1 text-xs font-extrabold tracking-tight'

  const iconSizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <Badge
      variant="outline"
      className={`h-auto inline-flex items-center gap-1.5 rounded-full border shadow-2xs whitespace-nowrap transition-all ${sizeClasses} ${className}`}
      style={{
        background: style.bg,
        color: style.color,
        borderColor: style.border
      }}
    >
      {renderIcon(status, resolved.tone, iconSizeClass, resolved.iconKey)}
      <span>{customLabel || resolved.label}</span>
    </Badge>
  )
}

export const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  const resolved = resolveStatusConfig(status)
  const style = TONE_STYLE[resolved.tone]
  return <span style={{ color: style.color }}>{renderIcon(status, resolved.tone, 'w-4 h-4', resolved.iconKey)}</span>
}
