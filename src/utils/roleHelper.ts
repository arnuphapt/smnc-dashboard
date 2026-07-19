export interface RoleOption {
  value: 'admin' | 'teacher' | 'expert'
  label: string
  shortLabel: string
  colorClass: string
  bgClass: string
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'teacher',
    label: 'อาจารย์ (Teacher)',
    shortLabel: 'อาจารย์',
    colorClass: 'text-[#0EA5A0]',
    bgClass: 'bg-teal-50 text-teal-700 border border-teal-200/60',
  },
  {
    value: 'expert',
    label: 'ผู้ทรงคุณวุฒิ (Expert)',
    shortLabel: 'ผู้ทรงคุณวุฒิ',
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50 text-purple-700 border border-purple-200/60',
  },
  {
    value: 'admin',
    label: 'ผู้ดูแลระบบ (Admin)',
    shortLabel: 'ผู้ดูแลระบบ',
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50 text-red-700 border border-red-200/60',
  },
]

/**
 * Parses role string into list of active role keys
 */
export const getUserRoles = (roleStr?: string | null): string[] => {
  if (!roleStr) return ['teacher']
  const roles = roleStr.split(',').map((r) => r.trim()).filter(Boolean)
  return roles.length > 0 ? roles : ['teacher']
}

/**
 * Checks if user has a target role (Admin automatically passes all checks!)
 */
export const hasRole = (roleStr?: string | null, targetRole?: string): boolean => {
  if (!roleStr) return false
  const roles = getUserRoles(roleStr)
  if (roles.includes('admin')) return true
  return targetRole ? roles.includes(targetRole) : false
}

/**
 * Checks if user explicitly has a target role (without auto-admin bypass)
 */
export const hasExactRole = (roleStr?: string | null, targetRole?: string): boolean => {
  if (!roleStr || !targetRole) return false
  const roles = getUserRoles(roleStr)
  return roles.includes(targetRole)
}

/**
 * Formats roles for display label (e.g. "ผู้ดูแลระบบ, ผู้ทรงคุณวุฒิ")
 */
export const formatUserRolesText = (roleStr?: string | null): string => {
  const roles = getUserRoles(roleStr)
  return roles
    .map((r) => {
      const found = ROLE_OPTIONS.find((opt) => opt.value === r)
      return found ? found.shortLabel : r.toUpperCase()
    })
    .join(', ')
}
