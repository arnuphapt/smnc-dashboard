import {
  BookOpen,
  Lightbulb,
  FileCheck,
  Award,
  Share2,
  LayoutGrid,
  Settings,
  Users,
  Shield,
  Calendar,
  Clipboard,
} from 'lucide-react'

export interface SubNavItem {
  slug?: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  isHeader?: boolean
}

export const REPOSITORY_SUBNAV: SubNavItem[] = [
  { slug: 'research', icon: BookOpen, label: 'คลังผลงานวิจัย' },
  { slug: 'innovation', icon: Lightbulb, label: 'คลังนวัตกรรม' },
  { slug: 'intellectual_property', icon: FileCheck, label: 'คลังทรัพย์สินทางปัญญา' },
  { slug: 'award', icon: Award, label: 'คลังรางวัลและความสำเร็จ' },
  { slug: 'utilization', icon: Share2, label: 'การนำไปใช้ประโยชน์' },
]

export const MASTERDATA_SUBNAV: SubNavItem[] = [
  { isHeader: true, label: 'Overview & Settings' },
  { slug: '', icon: LayoutGrid, label: 'Master Overview' },
  { slug: 'masters/research_type', icon: Settings, label: 'Master Creator Type' },
  { slug: 'masters/department', icon: Settings, label: 'Master Department' },
  { slug: 'masters/ip_type', icon: Settings, label: 'Master IP Type' },
  { slug: 'masters/award_level', icon: Settings, label: 'Master Award Level' },
  { slug: 'masters/utilization_type', icon: Settings, label: 'Master Utilization Type' },
  { slug: 'masters/journal_rank', icon: Settings, label: 'Master Journal Rank' },
  { slug: 'masters/scope', icon: Settings, label: 'Master Scope' },
  { slug: 'masters/innovation_type', icon: Settings, label: 'Master Innovation Type' },
  { slug: 'masters/source', icon: Settings, label: 'Master Source' },
  { slug: 'masters/ip_current_status', icon: Settings, label: 'Master IP Status' },
  { slug: 'masters/venue', icon: Settings, label: 'Master Venue' },
  { slug: 'masters/year', icon: Settings, label: 'Master Year' },
  { slug: 'masters/ethics_criteria', icon: Settings, label: 'Master Ethics Criteria' },
  { slug: 'users', icon: Users, label: 'Master Users' },
  { slug: 'roles', icon: Shield, label: 'Master Roles' },
  { slug: 'event', icon: Calendar, label: 'Master Event' },
  { slug: 'forms', icon: Clipboard, label: 'Master Forms' },
  { isHeader: true, label: 'Content Management' },
  { slug: 'items/research', icon: BookOpen, label: 'Master Research' },
  { slug: 'items/innovation', icon: Lightbulb, label: 'Master Innovation' },
  { slug: 'items/intellectual_property', icon: FileCheck, label: 'Master IP' },
  { slug: 'items/award', icon: Award, label: 'Master Award' },
  { slug: 'items/utilization', icon: Share2, label: 'Master Utilization' },
]
