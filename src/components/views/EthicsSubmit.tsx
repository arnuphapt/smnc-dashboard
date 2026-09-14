'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
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
  ShieldAlert,
  X,
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

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ethicsSubmissionSchema, EthicsSubmissionFormValues } from '@/schemas/ethicsSchema'
import { useEthicsForms, useEthicsSubmissions, useSubmitEthics } from '@/hooks/queries/useEthics'
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime'

const inputBase = "w-full text-sm px-4 py-2.5 rounded-2xl focus:outline-none transition-all duration-200"
const inputSty = { border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A' }

interface SingleFileSlotProps {
  id: string
  code: string
  title: string
  required?: boolean
  file: File | null
  onFileChange: (file: File | null) => void
}

const SingleFileSlot: React.FC<SingleFileSlotProps> = ({
  id,
  code,
  title,
  required = false,
  file,
  onFileChange,
}) => (
  <div
    className={`p-3.5 rounded-2xl border transition-all ${
      file
        ? 'bg-emerald-50/40 border-emerald-200'
        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300'
    }`}
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
        <span className="px-2.5 py-1 rounded-xl bg-[#E8F6F5] text-[#00796B] border border-[#BCE5E2] font-mono text-[11px] font-black shrink-0">
          {code}
        </span>
        <span className="text-xs font-extrabold text-[#0F172A] leading-snug">
          {title} {required && <span className="text-rose-600">*</span>}
        </span>
      </div>

      {!file ? (
        <label
          htmlFor={id}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-[#00796B] bg-white border border-[#BCE5E2] hover:bg-[#E8F6F5] cursor-pointer transition shadow-2xs shrink-0 self-start sm:self-center"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>เลือกไฟล์</span>
          <input
            id={id}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFileChange(f)
              e.target.value = ''
            }}
          />
        </label>
      ) : null}
    </div>

    {file && (
      <div className="mt-2.5 flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800 truncate" title={file.name}>
            {file.name}
          </span>
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </span>
        </div>
        <button
          type="button"
          onClick={() => onFileChange(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          title="ลบไฟล์นี้"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )}
  </div>
)

export const EthicsSubmit: React.FC = () => {
  const { user, isPageAllowed } = useAuth()
  const { data: forms = [] } = useEthicsForms()
  const { data: submissions = [] } = useEthicsSubmissions(user?.id)
  const submitEthicsMutation = useSubmitEthics()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EthicsSubmissionFormValues>({
    resolver: zodResolver(ethicsSubmissionSchema),
    defaultValues: {
      project_title: '',
      project_description: '',
    },
  })

  // 5 distinct upload slots
  const [fileEC02, setFileEC02] = useState<File | null>(null)
  const [fileEC03, setFileEC03] = useState<File | null>(null)
  const [fileEC04, setFileEC04] = useState<File | null>(null)
  const [fileEC05, setFileEC05] = useState<File | null>(null)
  const [otherFiles, setOtherFiles] = useState<File[]>([])

  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useSupabaseRealtime(
    user
      ? [{ channelName: 'ethics-submit-sub-rt', table: 'ethics_submissions', queryKeys: [['ethics_submissions']] }]
      : []
  )

  const handleAddOtherFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const added = Array.from(e.target.files)
      setOtherFiles((prev) => [...prev, ...added])
      e.target.value = ''
    }
  }

  const removeOtherFile = (index: number) => {
    setOtherFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (values: EthicsSubmissionFormValues) => {
    if (!user) return
    setFormError('')
    setFormSuccess('')

    if (!fileEC02) {
      setFormError('กรุณาแนบไฟล์ "SMNC EC 02 แบบเสนอโครงการวิจัยเพื่อรับการพิจารณาจริยธรรมการวิจัยในมนุษย์"')
      return
    }

    const allFilesToUpload: { file: File; customName: string }[] = []
    if (fileEC02) {
      allFilesToUpload.push({
        file: fileEC02,
        customName: `[SMNC EC 02] ${fileEC02.name}`,
      })
    }
    if (fileEC03) {
      allFilesToUpload.push({
        file: fileEC03,
        customName: `[SMNC EC 03] ${fileEC03.name}`,
      })
    }
    if (fileEC04) {
      allFilesToUpload.push({
        file: fileEC04,
        customName: `[SMNC EC 04] ${fileEC04.name}`,
      })
    }
    if (fileEC05) {
      allFilesToUpload.push({
        file: fileEC05,
        customName: `[SMNC EC 05] ${fileEC05.name}`,
      })
    }
    otherFiles.forEach((f) => {
      allFilesToUpload.push({
        file: f,
        customName: `[อื่นๆ] ${f.name}`,
      })
    })

    try {
      await submitEthicsMutation.mutateAsync({
        submitter_id: user.id,
        project_title: values.project_title,
        project_description: values.project_description,
        files: allFilesToUpload,
      })
      setFormSuccess('ยื่นคำขอรับการพิจารณาจริยธรรมเรียบร้อยแล้ว!')
      reset()
      setFileEC02(null)
      setFileEC03(null)
      setFileEC04(null)
      setFileEC05(null)
      setOtherFiles([])
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  const pendingCount = submissions.filter(s => s.status === 'ยื่นแล้ว' || s.status === 'กำลังตรวจ').length
  const approvedCount = submissions.filter(s => s.status === 'อนุมัติ').length

  if (!isPageAllowed('ethics_submit')) {
    return (
      <div className="flex-1 space-y-6 animate-fadeIn">
        <EmptyState
          icon={<ShieldAlert className="w-10 h-10 text-slate-400" />}
          title="ไม่มีสิทธิ์เข้าถึงหน้านี้"
          body="บัญชีของคุณไม่ได้รับสิทธิ์เข้าถึงหน้ายื่นโครงร่างวิจัย (IRB) กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดสิทธิ์การใช้งาน"
        />
      </div>
    )
  }

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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
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
                  <Input
                    type="text"
                    placeholder="ระบุชื่อโครงการวิจัย (ภาษาไทยและอังกฤษ)..."
                    {...register('project_title')}
                    className={inputBase}
                    style={inputSty}
                  />
                  {errors.project_title && (
                    <p className="text-[10px] text-[#EF6C4A] font-bold mt-1">{errors.project_title.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-[#0F172A]">รายละเอียดสรุปย่อ</label>
                  <Textarea
                    rows={3}
                    placeholder="วัตถุประสงค์หรือรายละเอียดเบื้องต้นของโครงการ..."
                    {...register('project_description')}
                    className={inputBase + ' resize-none'}
                    style={inputSty}
                  />
                </div>

                {/* 5 UPLOAD SLOTS */}
                <div className="space-y-3 pt-2">
                  <div className="border-b border-slate-200 pb-2">
                    <label className="block text-xs font-black text-[#0F172A] uppercase tracking-wider">
                      เอกสารประกอบการยื่นขอรับรองจริยธรรม (5 ช่องรายการ)
                    </label>
                    <p className="text-[10px] text-[#64748B] font-semibold mt-0.5">
                      รองรับไฟล์ PDF, Word (.doc, .docx) — ขนาดสูงสุดไม่เกิน 50 MB ต่อไฟล์
                    </p>
                  </div>

                  {/* Slot 1: SMNC EC 02 */}
                  <SingleFileSlot
                    id="slot-ec-02"
                    code="SMNC EC 02"
                    title="แบบเสนอโครงการวิจัยเพื่อรับการพิจารณาจริยธรรมการวิจัยในมนุษย์"
                    required
                    file={fileEC02}
                    onFileChange={setFileEC02}
                  />

                  {/* Slot 2: SMNC EC 03 */}
                  <SingleFileSlot
                    id="slot-ec-03"
                    code="SMNC EC 03"
                    title="แบบฟอร์มประวัติผู้วิจัย"
                    file={fileEC03}
                    onFileChange={setFileEC03}
                  />

                  {/* Slot 3: SMNC EC 04 */}
                  <SingleFileSlot
                    id="slot-ec-04"
                    code="SMNC EC 04"
                    title="เอกสารชี้แจงข้อมูลรายละเอียดโครงการิจัยสำหรับอาสาสมัครวิจัย"
                    file={fileEC04}
                    onFileChange={setFileEC04}
                  />

                  {/* Slot 4: SMNC EC 05 */}
                  <SingleFileSlot
                    id="slot-ec-05"
                    code="SMNC EC 05"
                    title="เอกสารแสดงความยินยอมโดยได้รับการบอกกล่าว"
                    file={fileEC05}
                    onFileChange={setFileEC05}
                  />

                  {/* Slot 5: อื่นๆ (แนบได้หลายไฟล์) */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      otherFiles.length > 0
                        ? 'bg-slate-50 border-slate-300'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-200 text-slate-700 font-mono text-[11px] font-black shrink-0">
                          อื่นๆ
                        </span>
                        <div>
                          <span className="text-xs font-extrabold text-[#0F172A] leading-snug block">
                            อื่นๆ (แนบได้หลายไฟล์)
                          </span>
                          <span className="text-[10px] text-[#64748B] font-medium block">
                            เช่น เครื่องมือวิจัย แบบสอบถาม เอกสารยินยอมจากหน่วยงาน ฯลฯ
                          </span>
                        </div>
                      </div>

                      <label
                        htmlFor="slot-other-files"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer transition shadow-2xs shrink-0 self-start sm:self-center"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                        <span>เลือกไฟล์ (หลายไฟล์)</span>
                        <input
                          id="slot-other-files"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleAddOtherFiles}
                        />
                      </label>
                    </div>

                    {otherFiles.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {otherFiles.map((f, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                              <span className="text-xs font-bold text-slate-800 truncate" title={f.name}>
                                {f.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeOtherFile(idx)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="ลบไฟล์นี้"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs font-bold text-[#64748B]">
                  รวมเอกสารที่เลือกทั้งหมด:{' '}
                  <span className="font-extrabold text-[#00796B]">
                    {(fileEC02 ? 1 : 0) + (fileEC03 ? 1 : 0) + (fileEC04 ? 1 : 0) + (fileEC05 ? 1 : 0) + otherFiles.length} ไฟล์
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={submitEthicsMutation.isPending}
                  className="w-full sm:w-auto py-2.5 h-auto rounded-full text-sm font-extrabold disabled:opacity-50 btn-primary px-8 cursor-pointer"
                >
                  {submitEthicsMutation.isPending ? 'กำลังอัปโหลดเอกสาร...' : 'ส่งคำขอยื่นจริยธรรม →'}
                </Button>
              </div>
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
