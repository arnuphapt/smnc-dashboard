// Mock the supabase client BEFORE importing roleHelper, since fetchRoleOptions
// calls supabase.from('roles').select('*').order(...) at runtime now instead
// of roleHelper exporting a static 4-entry ROLE_OPTIONS const.
const mockOrder = jest.fn()
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: mockOrder,
      })),
    })),
  },
}))

import { getUserRoles, hasRole, hasExactRole, formatUserRolesText, fetchRoleOptions, ROLE_OPTIONS as roleOptionsRef, isPageAllowedForUser } from './roleHelper'

// Fixture matching the 4 roles seeded by the roles table migration
// (supabase/migrations/20260806000000_add_roles_table.sql).
const SEEDED_ROLES_FIXTURE = [
  { key: 'teacher', label: 'อาจารย์ (Teacher)', short_label: 'อาจารย์', description: '', icon_name: 'GraduationCap', color_key: 'teal', is_locked: false, sort_order: 1 },
  { key: 'expert', label: 'ผู้ทรงคุณวุฒิ (Expert)', short_label: 'ผู้ทรงคุณวุฒิ', description: '', icon_name: 'UserCheck', color_key: 'purple', is_locked: false, sort_order: 2 },
  { key: 'assistant_admin', label: 'ผู้ช่วยแอดมิน (Assistant Admin)', short_label: 'ผู้ช่วยแอดมิน', description: '', icon_name: 'Shield', color_key: 'orange', is_locked: false, sort_order: 3 },
  { key: 'admin', label: 'ผู้ดูแลระบบ (Admin)', short_label: 'ผู้ดูแลระบบ', description: '', icon_name: 'Shield', color_key: 'red', is_locked: true, sort_order: 4 },
]

describe('roleHelper utils', () => {
  describe('getUserRoles', () => {
    it('returns ["teacher"] for null, undefined, or empty string', () => {
      expect(getUserRoles(null)).toEqual(['teacher'])
      expect(getUserRoles(undefined)).toEqual(['teacher'])
      expect(getUserRoles('')).toEqual(['teacher'])
      expect(getUserRoles('  ')).toEqual(['teacher'])
    })

    it('splits comma-separated roles into trimmed array', () => {
      expect(getUserRoles('admin, expert')).toEqual(['admin', 'expert'])
      expect(getUserRoles('teacher')).toEqual(['teacher'])
    })
  })

  describe('hasRole', () => {
    it('returns false if roleStr is empty or falsy', () => {
      expect(hasRole(null, 'admin')).toBe(false)
      expect(hasRole(undefined, 'teacher')).toBe(false)
      expect(hasRole('', 'expert')).toBe(false)
    })

    it('returns true for admin users regardless of targetRole', () => {
      expect(hasRole('admin', 'expert')).toBe(true)
      expect(hasRole('admin, teacher', 'assistant_admin')).toBe(true)
    })

    it('returns true if user has targetRole', () => {
      expect(hasRole('expert', 'expert')).toBe(true)
      expect(hasRole('teacher, expert', 'expert')).toBe(true)
    })

    it('returns false if user does not have targetRole and is not admin', () => {
      expect(hasRole('teacher', 'expert')).toBe(false)
      expect(hasRole('teacher', undefined)).toBe(false)
    })
  })

  describe('hasExactRole', () => {
    it('returns false if arguments are missing', () => {
      expect(hasExactRole(null, 'admin')).toBe(false)
      expect(hasExactRole('teacher', undefined)).toBe(false)
    })

    it('returns true only if user explicitly has the exact targetRole', () => {
      expect(hasExactRole('admin', 'admin')).toBe(true)
      expect(hasExactRole('teacher', 'admin')).toBe(false)
      expect(hasExactRole('teacher, expert', 'expert')).toBe(true)
    })
  })

  describe('fetchRoleOptions', () => {
    beforeEach(() => {
      mockOrder.mockReset()
    })

    it('fetches roles from the roles table and maps them to RoleOption shape', async () => {
      mockOrder.mockResolvedValueOnce({ data: SEEDED_ROLES_FIXTURE, error: null })

      const options = await fetchRoleOptions()

      expect(options).toHaveLength(4)
      const values = options.map((o) => o.value)
      expect(values).toEqual(['teacher', 'expert', 'assistant_admin', 'admin'])

      const teacher = options.find((o) => o.value === 'teacher')
      expect(teacher?.label).toBe('อาจารย์ (Teacher)')
      expect(teacher?.shortLabel).toBe('อาจารย์')
      expect(teacher?.iconName).toBe('GraduationCap')
      expect(teacher?.colorClass).toBe('text-[#0EA5A0]')
      expect(teacher?.bgClass).toContain('bg-teal-50')
    })

    it('updates the module-level ROLE_OPTIONS cache as a side effect', async () => {
      mockOrder.mockResolvedValueOnce({ data: SEEDED_ROLES_FIXTURE, error: null })

      await fetchRoleOptions()

      expect(roleOptionsRef).toHaveLength(4)
      expect(roleOptionsRef.map((o) => o.value)).toEqual(['teacher', 'expert', 'assistant_admin', 'admin'])
    })

    it('supports dynamically created roles beyond the original 4 (the whole point of this feature)', async () => {
      mockOrder.mockResolvedValueOnce({
        data: [...SEEDED_ROLES_FIXTURE, { key: 'lab_coordinator', label: 'ผู้ประสานงานห้องปฏิบัติการ', short_label: 'ผู้ประสานงาน', description: '', icon_name: 'FlaskConical', color_key: 'blue', is_locked: false, sort_order: 5 }],
        error: null,
      })

      const options = await fetchRoleOptions()
      expect(options).toHaveLength(5)
      expect(options.some((o) => o.value === 'lab_coordinator')).toBe(true)
    })

    it('falls back to the existing cached ROLE_OPTIONS on fetch error, without throwing', async () => {
      mockOrder.mockResolvedValueOnce({ data: SEEDED_ROLES_FIXTURE, error: null })
      await fetchRoleOptions()

      mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'network error' } })
      const options = await fetchRoleOptions()

      // Falls back to whatever was cached before (still the 4 seeded roles),
      // does not wipe ROLE_OPTIONS to empty just because one fetch failed.
      expect(options).toHaveLength(4)
    })

    it('unknown color_key falls back to the slate palette instead of throwing', async () => {
      mockOrder.mockResolvedValueOnce({
        data: [{ key: 'weird_role', label: 'Weird', short_label: 'Weird', description: '', icon_name: 'Shield', color_key: 'nonexistent_color', is_locked: false, sort_order: 1 }],
        error: null,
      })

      const options = await fetchRoleOptions()
      expect(options[0].colorClass).toBe('text-slate-700')
    })
  })

  describe('formatUserRolesText', () => {
    beforeEach(async () => {
      mockOrder.mockReset()
      mockOrder.mockResolvedValueOnce({ data: SEEDED_ROLES_FIXTURE, error: null })
      await fetchRoleOptions()
    })

    it('formats single role into short display label', () => {
      expect(formatUserRolesText('teacher')).toBe('อาจารย์')
      expect(formatUserRolesText('admin')).toBe('ผู้ดูแลระบบ')
      expect(formatUserRolesText('expert')).toBe('ผู้ทรงคุณวุฒิ')
      expect(formatUserRolesText('assistant_admin')).toBe('ผู้ช่วยแอดมิน')
    })

    it('formats multiple roles joined by comma', () => {
      expect(formatUserRolesText('admin, expert')).toBe('ผู้ดูแลระบบ, ผู้ทรงคุณวุฒิ')
    })

    it('falls back to uppercase role name for unknown roles', () => {
      expect(formatUserRolesText('custom_role')).toBe('CUSTOM_ROLE')
    })
  })

  describe('isPageAllowedForUser', () => {
    const permissions = [
      { role: 'expert', page_key: 'ethics_submit', can_view: false },
      { role: 'expert', page_key: 'ethics_submissions', can_view: true },
      { role: 'teacher', page_key: 'ethics_submit', can_view: true },
    ]

    it('returns true if user is null or undefined or empty', () => {
      expect(isPageAllowedForUser(null, 'ethics_submit', permissions)).toBe(true)
      expect(isPageAllowedForUser(undefined, 'ethics_submit', permissions)).toBe(true)
      expect(isPageAllowedForUser('', 'ethics_submit', permissions)).toBe(true)
    })

    it('returns true if user is admin', () => {
      expect(isPageAllowedForUser('admin', 'ethics_submit', permissions)).toBe(true)
      expect(isPageAllowedForUser('admin, expert', 'ethics_submit', permissions)).toBe(true)
    })

    it('returns false if explicit record sets can_view to false', () => {
      expect(isPageAllowedForUser('expert', 'ethics_submit', permissions)).toBe(false)
    })

    it('returns true if explicit record sets can_view to true', () => {
      expect(isPageAllowedForUser('expert', 'ethics_submissions', permissions)).toBe(true)
    })

    it('returns true if no explicit record exists for user role', () => {
      expect(isPageAllowedForUser('expert', 'unrecorded_page', permissions)).toBe(true)
    })

    it('returns true if any of multi-roles allows access', () => {
      expect(isPageAllowedForUser('expert, teacher', 'ethics_submit', permissions)).toBe(true)
    })
  })
})
