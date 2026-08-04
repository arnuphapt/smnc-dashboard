import { appointmentSchema, clinicEventSchema } from './clinicSchema'

describe('clinicSchema', () => {
  describe('appointmentSchema', () => {
    it('validates appointment form with valid values', () => {
      const validData = {
        topic: 'คำถามการใช้สถิติ SPSS',
        notes: 'ต้องการคำปรึกษาเพิ่มเติม',
        time: '09:00',
      }
      const result = appointmentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('fails when topic is less than 3 characters', () => {
      const invalidData = {
        topic: 'ab',
        time: '09:00',
      }
      const result = appointmentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('กรุณากรอกหัวข้อที่ขอปรึกษาอย่างน้อย 3 ตัวอักษร')
      }
    })
  })

  describe('clinicEventSchema', () => {
    it('validates clinic event form values', () => {
      const validData = {
        title: 'อบรมเชิงปฏิบัติการวิจัย',
        description: 'รายละเอียดการอบรม',
        event_date: '2026-08-10',
        location: 'ห้องประชุม 1',
        capacity: 50,
      }
      const result = clinicEventSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('fails when title or event_date is missing', () => {
      const invalidData = {
        title: 'ab',
        event_date: '',
      }
      const result = clinicEventSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
