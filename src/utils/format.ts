// Excel stores dates as a serial number of days since 1899-12-30.
// 25569 is the number of days between that epoch and the Unix epoch (1970-01-01).
export const formatExcelDate = (serial: unknown): string => {
  if (!serial) return ''
  if (isNaN(Number(serial))) return String(serial)
  const excelSerial = Number(serial)
  const date = new Date((excelSerial - 25569) * 86400 * 1000)
  if (isNaN(date.getTime())) return String(serial)

  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yy = String(date.getFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}

export type WisdomCategory = 'research' | 'innovation' | 'intellectual_property' | 'award' | 'utilization'

const CATEGORY_LABELS: Record<string, string> = {
  research: 'วิจัย',
  innovation: 'นวัตกรรม',
  intellectual_property: 'ทรัพย์สินทางปัญญา',
  award: 'รางวัล',
  utilization: 'การใช้ประโยชน์',
}

export const getCategoryLabel = (category: string): string => CATEGORY_LABELS[category] || category

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  research: 'bg-cyan-50 text-cyan-700 border border-cyan-200/50',
  innovation: 'bg-amber-50 text-amber-700 border border-amber-200/50',
  intellectual_property: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
  award: 'bg-purple-50 text-purple-700 border border-purple-200/50',
  utilization: 'bg-pink-50 text-pink-700 border border-pink-200/50',
}

export const getCategoryColor = (category: string): string =>
  CATEGORY_BADGE_CLASSES[category] || 'bg-slate-50 text-slate-600 border border-slate-200'
