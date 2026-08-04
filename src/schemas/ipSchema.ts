import { z } from 'zod'

export const ipStatusUpdateSchema = z.object({
  req_number: z.string().optional(),
  step: z.string().optional(),
  admin_notes: z.string().optional(),
  status: z.string().min(1, 'กรุณาเลือกสถานะ'),
})

export type IPStatusUpdateFormValues = z.infer<typeof ipStatusUpdateSchema>
