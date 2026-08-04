import { z } from 'zod'

export const appointmentSchema = z.object({
  topic: z.string().min(3, 'กรุณากรอกหัวข้อที่ขอปรึกษาอย่างน้อย 3 ตัวอักษร'),
  notes: z.string().optional(),
  time: z.string(),
})

export type AppointmentFormValues = z.infer<typeof appointmentSchema>

export const clinicEventSchema = z.object({
  title: z.string().min(3, 'กรุณากรอกชื่อกิจกรรมอย่างน้อย 3 ตัวอักษร'),
  description: z.string().optional(),
  event_date: z.string().min(1, 'กรุณาเลือกวันที่จัดกิจกรรม'),
  location: z.string().optional(),
  capacity: z.coerce.number().min(1, 'จำนวนที่นั่งต้องมากกว่า 0').optional(),
})

export type ClinicEventFormValues = z.infer<typeof clinicEventSchema>
