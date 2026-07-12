import { describe, it, expect } from 'vitest'
import { formatExcelDate, getCategoryLabel, getCategoryColor } from './format'

describe('formatExcelDate', () => {
  it('converts an Excel serial date to DD/MM/YY', () => {
    // 45000 => 2023-03-15
    expect(formatExcelDate(45000)).toBe('15/03/23')
  })

  it('accepts numeric strings the same way as numbers', () => {
    expect(formatExcelDate('45000')).toBe(formatExcelDate(45000))
  })

  it('returns an empty string for null/undefined/0', () => {
    expect(formatExcelDate(null)).toBe('')
    expect(formatExcelDate(undefined)).toBe('')
    expect(formatExcelDate(0)).toBe('')
  })

  it('passes through non-numeric values unchanged', () => {
    expect(formatExcelDate('ยังไม่ระบุ')).toBe('ยังไม่ระบุ')
  })
})

describe('getCategoryLabel', () => {
  it('maps known wisdom categories to Thai labels', () => {
    expect(getCategoryLabel('research')).toBe('วิจัย')
    expect(getCategoryLabel('innovation')).toBe('นวัตกรรม')
    expect(getCategoryLabel('intellectual_property')).toBe('ทรัพย์สินทางปัญญา')
    expect(getCategoryLabel('award')).toBe('รางวัล')
    expect(getCategoryLabel('utilization')).toBe('การใช้ประโยชน์')
  })

  it('falls back to the raw value for an unknown category', () => {
    expect(getCategoryLabel('something_else')).toBe('something_else')
  })
})

describe('getCategoryColor', () => {
  it('returns a distinct badge class per category', () => {
    const categories = ['research', 'innovation', 'intellectual_property', 'award', 'utilization']
    const classes = categories.map(getCategoryColor)
    expect(new Set(classes).size).toBe(categories.length)
  })

  it('falls back to a neutral slate class for an unknown category', () => {
    expect(getCategoryColor('nope')).toContain('slate')
  })
})
