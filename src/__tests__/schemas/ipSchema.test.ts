import { ipStatusUpdateSchema } from '@/schemas/ipSchema'

describe('ipSchema', () => {
  it('validates ipStatusUpdateSchema with required status', () => {
    const validData = {
      req_number: 'REQ-12345',
      step: 'ขั้นตอนที่ 1',
      admin_notes: 'ตรวจสอบแล้ว',
      status: 'อยู่ระหว่างดำเนินการ',
    }
    const result = ipStatusUpdateSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('fails when status is empty string', () => {
    const invalidData = {
      status: '',
    }
    const result = ipStatusUpdateSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('กรุณาเลือกสถานะ')
    }
  })
})
