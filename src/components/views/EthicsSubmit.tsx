'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

const supabase = createClient()
import {
  FileText,
  UploadCloud,
  Clock,
  CheckCircle,
  AlertCircle,
  Clipboard,
  ShieldCheck,
  FileCheck,
  Download,
  ClipboardList,
} from 'lucide-react'
import { PageHeader, ContentPanel, SectionHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface DownloadableForm {
  id: string
  title: string
  file_url: string
  category: string
}

interface EthicsSubmission {
  id: string
  project_title: string
  project_description?: string
  status: string
  assigned_reviewer_id?: string
  reviewer_notes?: string
  created_at: string
}

const inputBase = "w-full text-sm px-4 py-2.5 rounded-2xl focus:outline-none transition-all duration-200"
const inputSty = { border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A' }

export const EthicsSubmit: React.FC = () => {
  const { user } = useAuth()

  const [forms, setForms] = useState<DownloadableForm[]>([])
  const [submissions, setSubmissions] = useState<EthicsSubmission[]>([])

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase.from('downloadable_forms').select('*').eq('category', 'ethics').order('sort_order', { ascending: true })
      if (error) throw error
      setForms(data || [])
    } catch (err) { console.error(err) }
  }

  const fetchSubmissions = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('ethics_submissions').select('*').eq('submitter_id', user.id).order('created_at', { ascending: false })
      if (error) throw error
      setSubmissions(data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchForms()
    fetchSubmissions()
  }, [user])

  useEffect(() => {
    if (!user) return
    const s = supabase.channel('ethics-submit-sub-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_submissions' }, () => fetchSubmissions()).subscribe()
    return () => { supabase.removeChannel(s) }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setFormError(''); setFormSuccess(''); setIsSubmitting(true)
    if (!title.trim()) { setFormError('กรุณากรอกชื่อโครงร่างวิจัย'); setIsSubmitting(false); return }
    try {
      const { data: subData, error: subError } = await supabase.from('ethics_submissions').insert({ submitter_id: user.id, project_title: title.trim(), project_description: desc.trim(), status: 'ยื่นแล้ว' }).select().single()
      if (subError) throw subError
      const submissionId = subData.id
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const extIndex = file.name.lastIndexOf('.')
          const ext = extIndex !== -1 ? file.name.substring(extIndex) : ''
          const base = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name
          const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, '_')
          const safeName = /[a-zA-Z0-9]/.test(sanitizedBase) ? sanitizedBase : 'doc'
          const storagePath = `ethics/${user.id}/${Date.now()}_${safeName}${ext}`

          const { error: uploadError } = await supabase.storage.from('wisdom-private').upload(storagePath, file)
          if (uploadError) throw uploadError
          const { error: attachError } = await supabase.from('ethics_attachments').insert({ submission_id: submissionId, file_url: storagePath, file_name: file.name, file_type: file.type })
          if (attachError) throw attachError
        }
      }
      setFormSuccess('ยื่นคำขอรับการพิจารณาจริยธรรมเรียบร้อยแล้ว!')
      setTitle(''); setDesc(''); setFiles(null)
      const fileInput = document.getElementById('ethics-files') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err: any) { setFormError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล') } finally { setIsSubmitting(false) }
  }

  const pendingCount = submissions.filter(s => s.status === 'ยื่นแล้ว' || s.status === 'กำลังตรวจ').length
  const approvedCount = submissions.filter(s => s.status === 'อนุมัติ').length

  return (
    <div className="flex-1 space-y-6 animate-fadeIn">
      <PageHeader
        title="จริยธรรมการวิจัย"
        subtitle="Research Ethics — ยื่นคำขอรับรองจริยธรรมการวิจัยในมนุษย์ (IRB)"
        extraBadge="Ethics Review Board"
      />

      {/* HERO SECTION: IRB MASTHEAD & STATS */}
      <ContentPanel>
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-flip-card space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6F5] border border-[#BCE5E2] text-[#00796B] text-xs font-mono font-extrabold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>HUMAN RESEARCH ETHICS BOARD (IRB)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                ศูนย์พิจารณาจริยธรรมการวิจัยในมนุษย์
              </h2>
            </div>
            {user && (
              <Link
                href="/ethics/submissions"
                className="shrink-0 btn-primary text-xs flex items-center gap-2 !py-2.5 !px-5"
              >
                <ClipboardList className="w-4 h-4 stroke-[2.5]" />
                ดูรายการคำขอที่ยื่นแล้ว
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[#0F172A] border border-[#E2E8F0] font-bold shadow-xs">
                <Clipboard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">คำขอทั้งหมดของฉัน</span>
                <span className="text-xl font-mono font-black text-[#0F172A]">{submissions.length} รายการ</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[#0F172A] border border-[#E2E8F0] font-bold shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">อยู่ระหว่างพิจารณา</span>
                <span className="text-xl font-mono font-black text-[#0F172A]">{pendingCount} รายการ</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[#0F172A] border border-[#E2E8F0] font-bold shadow-xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">ผ่านการรับรองอนุมัติ</span>
                <span className="text-xl font-mono font-black text-[#0F172A]">{approvedCount} รายการ</span>
              </div>
            </div>
          </div>
        </div>
      </ContentPanel>

      {/* SECTION: SUBMIT FORM */}
      <ContentPanel>
        <SectionHeader eyebrow="ยื่นคำขอ IRB" title="ยื่นโครงร่างวิจัยขอรับการพิจารณาจริยธรรม" />
        <div className="mt-4">
          {!user ? (
            <EmptyState icon={<UploadCloud className="w-12 h-12 stroke-[1.5]" />} title="เข้าสู่ระบบเพื่อยื่นเอกสาร" body="จำเป็นต้องลงชื่อเข้าใช้ก่อนอัปโหลดไฟล์และยื่นโครงร่างวิจัย" dashed />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <p className="text-xs font-semibold text-[#64748B]">แนบไฟล์แบบฟอร์มที่ระบุรายละเอียดครบถ้วนและลงลายมือชื่อแล้ว</p>

              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-extrabold bg-[#FFF0ED] text-[#EF6C4A] border border-[#FF8A6A]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formError}
                </div>
              )}
              {formSuccess && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-extrabold bg-[#EBFBEE] text-[#27AE60] border border-[#A3E2B6]">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {formSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">ชื่อโครงร่างวิจัย *</label>
                  <Input type="text" required placeholder="ระบุชื่อโครงการวิจัย (ภาษาไทยและอังกฤษ)..." value={title} onChange={(e) => setTitle(e.target.value)} className={inputBase} style={inputSty} />
                </div>
                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">รายละเอียดสรุปย่อ</label>
                  <Textarea rows={3} placeholder="วัตถุประสงค์หรือรายละเอียดเบื้องต้นของโครงการ..." value={desc} onChange={(e) => setDesc(e.target.value)} className={inputBase + ' resize-none'} style={inputSty} />
                </div>
                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">อัปโหลดเอกสารประกอบ * <span className="font-normal text-[#64748B]">(เลือกได้หลายไฟล์)</span></label>
                  <Input type="file" id="ethics-files" multiple required accept=".pdf,.doc,.docx" onChange={(e) => setFiles(e.target.files)} className={inputBase + ' h-auto'} style={inputSty} />
                  <p className="text-[10px] mt-1 text-[#64748B] font-semibold">รองรับ PDF, Word เท่านั้น — ขนาดรวมไม่เกิน 25 MB</p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto py-2.5 h-auto rounded-full text-sm font-extrabold disabled:opacity-50 mt-2 btn-primary px-8"
              >
                {isSubmitting ? 'กำลังอัปโหลดเอกสาร...' : 'ส่งคำขอยื่นจริยธรรม →'}
              </Button>
            </form>
          )}
        </div>
      </ContentPanel>

      {/* SECTION: FORMS GRID */}
      <ContentPanel>
        <SectionHeader eyebrow="แบบฟอร์มทางการ" title="ดาวน์โหลดแบบฟอร์มยื่นขอรับรองจริยธรรมการวิจัย" />
        <div className="mt-4">
          {forms.length === 0 ? (
            <EmptyState icon={<Clipboard className="w-10 h-10 stroke-[1.5]" />} title="ยังไม่มีแบบฟอร์มอัปโหลด" body="ติดต่องานวิจัยสถาบันเพื่อรับแบบฟอร์มทางอีเมล" dashed />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0F172A] transition duration-200 shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white border border-[#E2E8F0] text-[#00796B] shadow-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs truncate text-[#0F172A] group-hover:text-[#00796B] transition-colors" title={form.title}>{form.title}</p>
                      <p className="text-[10px] font-mono font-bold text-[#64748B] mt-0.5">แบบฟอร์ม IRB ทางการ</p>
                    </div>
                  </div>
                  <a
                    href={form.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 shrink-0 btn-primary text-xs flex items-center gap-1.5 !py-1.5 !px-3"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    ดาวน์โหลด
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </ContentPanel>
    </div>
  )
}
