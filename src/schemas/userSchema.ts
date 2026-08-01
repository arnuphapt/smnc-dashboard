import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  role: z.enum(['admin', 'assistant_admin', 'teacher', 'expert'], {
    message: 'กรุณาเลือกสิทธิ์ผู้ใช้งาน',
  }),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>
