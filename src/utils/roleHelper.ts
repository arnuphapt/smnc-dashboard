import { supabase } from '@/services/supabase'

export interface RoleOption {
  value: string
  label: string
  shortLabel: string
  colorClass: string
  bgClass: string
  iconName: string
}

/**
 * Fixed palette of icon keys a role's `icon_name` column may reference.
 * Kept small and closed-ended (not free text) so the create-role UI can
 * present a picker instead of accepting arbitrary strings. Rendered to
 * actual lucide JSX via ICON_MAP in RolesTab.tsx/UsersTab.tsx (icon
 * components live at the UI layer to keep this file free of JSX).
 */
export const ICON_KEYS = ['Shield', 'GraduationCap', 'UserCheck', 'Lock', 'User', 'Users', 'BookOpen', 'FlaskConical'] as const
export type IconKey = (typeof ICON_KEYS)[number]

/**
 * Fixed palette of color keys a role's `color_key` column may reference,
 * mapped to the Tailwind class pairs already used by the 4 seeded roles.
 */
export const COLOR_MAP: Record<string, { colorClass: string; bgClass: string }> = {
  teal: {
    colorClass: 'text-[#0EA5A0]',
    bgClass: 'bg-teal-50 text-teal-700 border border-teal-200/60',
  },
  purple: {
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50 text-purple-700 border border-purple-200/60',
  },
  orange: {
    colorClass: 'text-orange-700',
    bgClass: 'bg-orange-50 text-orange-700 border border-orange-200/60',
  },
  red: {
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50 text-red-700 border border-red-200/60',
  },
  blue: {
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50 text-blue-700 border border-blue-200/60',
  },
  slate: {
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-50 text-slate-700 border border-slate-200/60',
  },
}
export const COLOR_KEYS = Object.keys(COLOR_MAP)

interface RoleRecord {
  key: string
  label: string
  short_label: string
  description: string
  icon_name: string
  color_key: string
  is_locked: boolean
  sort_order: number
}

const toRoleOption = (r: RoleRecord): RoleOption => {
  const colors = COLOR_MAP[r.color_key] || COLOR_MAP.slate
  return {
    value: r.key,
    label: r.label,
    shortLabel: r.short_label,
    colorClass: colors.colorClass,
    bgClass: colors.bgClass,
    iconName: r.icon_name,
  }
}

/**
 * Runtime-fetched role options, replacing the old static 4-entry const.
 * Populated by calling fetchRoleOptions() (e.g. once on mount in
 * AuthContext/UsersTab/RolesTab). Starts empty; consumers that read
 * ROLE_OPTIONS before the fetch resolves will simply see an empty list
 * until state updates trigger a re-render.
 */
export let ROLE_OPTIONS: RoleOption[] = []

/**
 * Fetches all roles from the `roles` table, updates the module-level
 * ROLE_OPTIONS cache, and returns the fresh list for callers that want to
 * store it directly in component state.
 */
export const fetchRoleOptions = async (): Promise<RoleOption[]> => {
  const { data, error } = await supabase.from('roles').select('*').order('sort_order')
  if (error || !data) {
    console.error('Error fetching roles:', error)
    return ROLE_OPTIONS
  }
  const options = (data as RoleRecord[]).map(toRoleOption)
  ROLE_OPTIONS = options
  return options
}

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

export interface RolePermission {
  id?: string
  role: string
  page_key: string
  can_view: boolean
}

/**
 * Checks if a specific page_key is allowed for a user based on DB permissions.
 */
export const isPageAllowedForUser = (
  userRoleString: string | undefined | null,
  pageKey: string,
  permissions: RolePermission[]
): boolean => {
  if (!userRoleString) return true
  if (hasRole(userRoleString, 'admin')) return true

  const userRoles = getUserRoles(userRoleString)
  if (userRoles.length === 0) return true

  // Any-role-allows: a multi-role user (e.g. "teacher,expert") should see a page
  // if ANY of their roles grants it. A role with no explicit record for this
  // pageKey has never been restricted, so it counts as allowing — it must NOT be
  // treated as a "deny vote" just because a different one of the user's roles
  // has an explicit can_view:false here. Only when EVERY one of the user's roles
  // has an explicit record AND all of them are false does this deny.
  for (const r of userRoles) {
    const perm = permissions.find((p) => p.role === r && p.page_key === pageKey)
    if (perm === undefined || perm.can_view) {
      return true
    }
  }

  return false
}
