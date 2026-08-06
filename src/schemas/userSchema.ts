import { z } from 'zod'

// role is validated as a non-empty string, not a closed enum, since roles are
// now created dynamically at runtime via the `roles` table (see roleHelper.ts
// fetchRoleOptions). Existence of the role key is checked at the call site
// against the fetched role list, not statically here.
export const createUserSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  role: z.string().min(1, 'กรุณาเลือกสิทธิ์ผู้ใช้งาน'),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>
