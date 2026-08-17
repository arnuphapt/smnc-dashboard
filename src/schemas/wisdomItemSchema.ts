import { z } from 'zod'

export const wisdomItemSchema = z.object({
  title: z.string().min(2, 'กรุณากรอกชื่อผลงาน/ชื่อโครงร่างวิจัยอย่างน้อย 2 ตัวอักษร'),
  category: z.enum(['research', 'innovation', 'intellectual_property', 'award', 'utilization'], {
    message: 'กรุณาเลือกประเภทผลงาน',
  }),
  description: z.string().optional(),
  authors: z.string().optional(),
  is_public: z.boolean().default(false),

  // Dynamic Metadata Fields
  dept: z.string().optional(),
  subtype: z.string().optional(),
  year: z.string().optional(),
  journal: z.string().optional(),
  regNum: z.string().optional(),
  regDate: z.string().optional(),
  organizer: z.string().optional(),
  orgUsed: z.string().optional(),
  impact: z.string().optional(),
  scope: z.string().optional(),
  journalRank: z.string().optional(),
  contribution: z.string().optional(),
  fundingHas: z.string().optional(),
  fundingDetail: z.string().optional(),
  source: z.string().optional(),
  ipStatus: z.string().optional(),
  applicationStatus: z.string().optional(),
  ipCurrentStatus: z.string().optional(),
  patentNum: z.string().optional(),
  creatorType: z.string().optional(),
  awardName: z.string().optional(),
  utilizationDate: z.string().optional(),
  published: z.string().optional(),
  presented: z.string().optional(),
  submissionDate: z.string().optional(),
  notes: z.string().optional(),
})

export type WisdomItemFormValues = z.infer<typeof wisdomItemSchema>
