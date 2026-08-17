import { ethicsSubmissionSchema } from '@/schemas/ethicsSchema'

describe('ethicsSchema', () => {
  it('validates project_title with 3+ characters', () => {
    const validData = {
      project_title: 'โครงการวิจัยการพยาบาลผู้ป่วยสูงอายุ',
      project_description: 'รายละเอียดเพิ่มเติม...',
    }
    const result = ethicsSubmissionSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('fails validation when project_title is less than 3 characters', () => {
    const invalidData = {
      project_title: 'AB',
    }
    const result = ethicsSubmissionSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('กรุณากรอกชื่อโครงร่างวิจัยอย่างน้อย 3 ตัวอักษร')
    }
  })
})
