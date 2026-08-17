import { wisdomItemSchema } from '@/schemas/wisdomItemSchema'

describe('wisdomItemSchema', () => {
  it('validates valid wisdom item data', () => {
    const validData = {
      title: 'นวัตกรรมแอปพลิเคชันพยาบาล',
      category: 'innovation',
      description: 'แอปพลิเคชันเพื่อการจัดการสุขภาพ',
      authors: 'ดร.สมชาย',
      is_public: true,
      dept: 'สาขาวิชาการพยาบาล',
      year: '2567',
    }
    const result = wisdomItemSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('fails when title is less than 2 characters', () => {
    const invalidData = {
      title: 'A',
      category: 'research',
    }
    const result = wisdomItemSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('กรุณากรอกชื่อผลงาน/ชื่อโครงร่างวิจัยอย่างน้อย 2 ตัวอักษร')
    }
  })

  it('fails when category is invalid', () => {
    const invalidData = {
      title: 'ชื่อผลงาน',
      category: 'invalid_category',
    }
    const result = wisdomItemSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
