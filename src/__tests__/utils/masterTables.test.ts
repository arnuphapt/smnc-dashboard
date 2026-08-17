import { getTableForCategory, getValueFieldForCategory } from '@/utils/masterTables'

describe('masterTables utils', () => {
  describe('getTableForCategory', () => {
    it('returns specific table name for known categories', () => {
      expect(getTableForCategory('research_type')).toBe('master_research_types')
      expect(getTableForCategory('department')).toBe('master_departments')
      expect(getTableForCategory('ip_type')).toBe('master_ip_types')
      expect(getTableForCategory('award_level')).toBe('master_award_levels')
      expect(getTableForCategory('year')).toBe('master_years')
    })

    it('returns lookup_options as fallback for unknown category', () => {
      expect(getTableForCategory('unknown_cat')).toBe('lookup_options')
    })
  })

  describe('getValueFieldForCategory', () => {
    it('returns specific value field for known categories', () => {
      expect(getValueFieldForCategory('ethics_criteria')).toBe('label')
      expect(getValueFieldForCategory('year')).toBe('year_be')
    })

    it('returns name as default fallback for other categories', () => {
      expect(getValueFieldForCategory('department')).toBe('name')
      expect(getValueFieldForCategory('unknown_cat')).toBe('name')
    })
  })
})
