import { getUserRoles, hasRole, hasExactRole, formatUserRolesText, ROLE_OPTIONS } from './roleHelper'

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

  describe('formatUserRolesText', () => {
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

  describe('ROLE_OPTIONS', () => {
    it('contains all 4 expected role options', () => {
      expect(ROLE_OPTIONS).toHaveLength(4)
      const values = ROLE_OPTIONS.map((o) => o.value)
      expect(values).toEqual(['teacher', 'expert', 'assistant_admin', 'admin'])
    })
  })
})
