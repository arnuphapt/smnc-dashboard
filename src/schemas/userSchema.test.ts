import { createUserSchema } from './userSchema'

describe('userSchema', () => {
  it('passes validation with valid email, password, and role', () => {
    const validData = {
      email: 'user@smnc.ac.th',
      password: 'password123',
      role: 'teacher',
    }
    const result = createUserSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('fails validation when email is invalid', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'password123',
      role: 'admin',
    }
    const result = createUserSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('กรุณากรอกอีเมลให้ถูกต้อง')
    }
  })

  it('fails validation when password is too short', () => {
    const invalidData = {
      email: 'user@smnc.ac.th',
      password: '123',
      role: 'expert',
    }
    const result = createUserSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    }
  })

  it('fails validation when role is empty', () => {
    const invalidData = {
      email: 'user@smnc.ac.th',
      password: 'password123',
      role: '',
    }
    const result = createUserSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('กรุณาเลือกสิทธิ์ผู้ใช้งาน')
    }
  })

  it('passes validation for dynamically-created role keys not in the original 4 (roles are now runtime-fetched, not a closed enum)', () => {
    const validData = {
      email: 'user@smnc.ac.th',
      password: 'password123',
      role: 'lab_coordinator',
    }
    const result = createUserSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})
