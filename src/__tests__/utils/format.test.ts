import { formatExcelDate, getCategoryLabel, getCategoryColor } from '@/utils/format'

describe('format utils', () => {
  describe('formatExcelDate', () => {
    it('returns empty string for falsy values', () => {
      expect(formatExcelDate(null)).toBe('')
      expect(formatExcelDate(undefined)).toBe('')
      expect(formatExcelDate('')).toBe('')
      expect(formatExcelDate(0)).toBe('')
    })

    it('returns string representation if serial is NaN', () => {
      expect(formatExcelDate('invalid-date')).toBe('invalid-date')
    })

    it('formats valid Excel date serial number', () => {
      // 45000 in Excel serial date format
      const formatted = formatExcelDate(45000)
      expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{2}$/)
    })

    it('returns original string if Date construction produces invalid date', () => {
      // Test invalid date fallback if date.getTime() is NaN
      const spy = jest.spyOn(Date.prototype, 'getTime').mockReturnValueOnce(NaN)
      expect(formatExcelDate(45000)).toBe('45000')
      spy.mockRestore()
    })
  })

  describe('getCategoryLabel', () => {
    it('returns correct Thai label for known categories', () => {
      expect(getCategoryLabel('research')).toBe('วิจัย')
      expect(getCategoryLabel('innovation')).toBe('นวัตกรรม')
      expect(getCategoryLabel('intellectual_property')).toBe('ทรัพย์สินทางปัญญา')
      expect(getCategoryLabel('award')).toBe('รางวัล')
      expect(getCategoryLabel('utilization')).toBe('การใช้ประโยชน์')
      expect(getCategoryLabel('academic')).toBe('บริการวิชาการ')
      expect(getCategoryLabel('creative')).toBe('งานสร้างสรรค์')
    })

    it('returns raw category key as fallback for unknown category', () => {
      expect(getCategoryLabel('unknown_cat')).toBe('unknown_cat')
    })
  })

  describe('getCategoryColor', () => {
    it('returns correct Tailwind CSS class string for known categories', () => {
      expect(getCategoryColor('research')).toContain('bg-cyan-50')
      expect(getCategoryColor('innovation')).toContain('bg-amber-50')
      expect(getCategoryColor('intellectual_property')).toContain('bg-emerald-50')
      expect(getCategoryColor('award')).toContain('bg-purple-50')
      expect(getCategoryColor('utilization')).toContain('bg-pink-50')
    })

    it('returns slate fallback for unknown categories', () => {
      expect(getCategoryColor('unknown_cat')).toBe('bg-slate-50 text-slate-600 border border-slate-200')
    })
  })
})
