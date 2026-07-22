import { z } from 'zod'

export const ethicsSubmissionSchema = z.object({
  project_title: z.string().min(3, 'กรุณากรอกชื่อโครงร่างวิจัยอย่างน้อย 3 ตัวอักษร'),
  project_description: z.string().optional(),
})

export type EthicsSubmissionFormValues = z.infer<typeof ethicsSubmissionSchema>
