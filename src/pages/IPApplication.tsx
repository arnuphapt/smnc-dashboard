import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import {
  FileText,
  UploadCloud,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Award
} from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { PageHeader, ContentPanel } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

interface DownloadableForm {
  id: string
  title: string
  file_url: string
  category: string
}

interface IPApp {
  id: string
  title: string
  ip_type: string
  request_number?: string
  status: string
  current_step?: string
  admin_notes?: string
  transferred_to_catalog: boolean
  created_at: string
}


const TimelineSteps: React.FC<{ status: string }> = ({ status }) => {
  const steps = ['ยื่นคำขอ', 'กำลังตรวจสอบ', 'รอเอกสารเพิ่ม', 'อนุมัติ']
  const activeIndex = status === 'อนุมัติ' ? 3 : status === 'ไม่อนุมัติ' ? 3 : status === 'รอเอกสารเพิ่ม' ? 2 : status === 'กำลังตรวจสอบ' ? 1 : 0

  return (
    <div className="flex items-center w-full mt-2">
      {steps.map((step, idx) => {
        const done = idx < activeIndex
        const active = idx === activeIndex
        const denied = active && status === 'ไม่อนุมัติ'
        const warning = active && status === 'รอเอกสารเพิ่ม'

        const dotBg = done ? '#0EA5A0' : active ? (denied ? '#9F1239' : warning ? '#B45309' : '#0B1D3A') : '#E2EDF8'
        const dotColor = done || active ? '#FFFFFF' : '#94A3B8'
        const lineColor = done ? '#0EA5A0' : '#E2EDF8'
        const labelColor = active ? '#0B1D3A' : done ? '#475569' : '#94A3B8'
        const labelWeight = active ? '800' : done ? '600' : '500'

        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center" style={{ minWidth: 0, flex: '0 0 auto' }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: dotBg, color: dotColor }}
              >
                {done ? <CheckCircle className="w-4 h-4" /> : denied ? <XCircle className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className="text-[9px] mt-1.5 text-center leading-tight"
                style={{ color: labelColor, fontWeight: labelWeight, maxWidth: '52px' }}
              >
                {idx === 3 && status === 'ไม่อนุมัติ' ? 'ไม่อนุมัติ' : step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="h-0.5 flex-1 mx-1 -mt-5 rounded-full" style={{ background: lineColor }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

const inputBase = "w-full text-sm px-4 py-2.5 rounded-xl focus:outline-none transition-all duration-200"
const inputSty = { border: '1.5px solid #CBD5E1', background: '#FAFCFF' }

export const IPApplication: React.FC = () => {
  const { user } = useAuth()
  const [activeSubTab, setActiveSubTab] = useState<'forms' | 'submit' | 'status'>('forms')
  const [forms, setForms] = useState<DownloadableForm[]>([])
  const [applications, setApplications] = useState<IPApp[]>([])

  const [title, setTitle] = useState('')
  const [ipType, setIpType] = useState('อนุสิทธิบัตร')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase.from('downloadable_forms').select('*').eq('category', 'ip').order('sort_order', { ascending: true })
      if (error) throw error
      setForms(data || [])
    } catch (err) { console.error(err) }
  }

  const fetchApplications = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('ip_applications').select('*').eq('applicant_id', user.id).order('created_at', { ascending: false })
      if (error) throw error
      setApplications(data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchForms() }, [user])
  useEffect(() => { if (activeSubTab === 'status') fetchApplications() }, [activeSubTab, user])

  useEffect(() => {
    if (!user) return
    const s = supabase.channel('ip-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ip_applications' }, () => fetchApplications()).subscribe()
    return () => { supabase.removeChannel(s) }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setFormError(''); setFormSuccess(''); setIsSubmitting(true)
    if (!title.trim()) { setFormError('กรุณากรอกชื่อผลงานทรัพย์สินทางปัญญา'); setIsSubmitting(false); return }
    try {
      const { error } = await supabase.from('ip_applications').insert({ applicant_id: user.id, title: title.trim(), ip_type: ipType, status: 'ยื่นคำขอ', current_step: 'ยื่นคำขอรับขึ้นทะเบียน' })
      if (error) throw error
      setFormSuccess('ยื่นคำขอขึ้นทะเบียนทรัพย์สินทางปัญญาเรียบร้อยแล้ว! ติดตามผลได้ในแท็บติดตามสถานะ')
      setTitle(''); setIpType('อนุสิทธิบัตร')
    } catch (err: any) { setFormError(err.message || 'เกิดข้อผิดพลาด') } finally { setIsSubmitting(false) }
  }

  const tabsConfig = [
    { key: 'forms', icon: <FileText className="w-4 h-4" />, label: 'แบบฟอร์ม & คำแนะนำ' },
    { key: 'submit', icon: <UploadCloud className="w-4 h-4" />, label: 'ยื่นคำขอจดทะเบียน' },
    { key: 'status', icon: <Clock className="w-4 h-4" />, label: 'ติดตามสถานะคำขอ' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      <PageHeader
        title="ทรัพย์สินทางปัญญา"
        subtitle="Intellectual Property — ยื่นขอขึ้นทะเบียน ติดตาม และจัดการสิทธิ์ผลงาน"
        extraBadge="IP Registration System"
        tabs={tabsConfig}
        activeTab={activeSubTab}
        onTabChange={(t) => setActiveSubTab(t as any)}
      />

      <ContentPanel>
        {/* PANEL 1: FORMS */}
        {activeSubTab === 'forms' && (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>ขั้นตอนและแบบฟอร์ม</p>
              <h3 className="text-base font-black" style={{ color: '#0B1D3A' }}>คู่มือการยื่นขอขึ้นทะเบียนทรัพย์สินทางปัญญา</h3>
            </div>

            {/* Steps guide */}
            <div className="p-6 rounded-2xl space-y-4" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}>
              {[
                { step: 'เลือกประเภทและดาวน์โหลดแบบฟอร์ม', detail: 'สิทธิบัตร อนุสิทธิบัตร ลิขสิทธิ์ หรือเครื่องหมายการค้า' },
                { step: 'จัดเตรียมเอกสารและหลักฐาน', detail: 'รูปภาพ รายละเอียดการประดิษฐ์ หรือซอร์สโค้ด (กรณีโปรแกรม)' },
                { step: 'ยื่นคำขอผ่านระบบนี้', detail: 'แจ้งชื่อผลงานและประเภทสิทธิ์ผ่านแท็บ "ยื่นคำขอจดทะเบียน"' },
                { step: 'ติดตามสถานะและรับผล', detail: 'แอดมินจะแจ้งผลผ่านหน้าติดตามสถานะและอัปเดตขั้นตอน' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5"
                    style={{ background: '#0B1D3A', color: '#0EA5A0' }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#0B1D3A' }}>{s.step}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Form list */}
            {forms.length > 0 && (
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3" style={{ color: '#0EA5A0' }}>แบบฟอร์มคำขอ</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {forms.map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center justify-between p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                      style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#0EA5A0' }}>
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate" style={{ color: '#0B1D3A' }} title={form.title}>{form.title}</p>
                          <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#94A3B8' }}>แบบฟอร์มคำขอสิทธิ์</p>
                        </div>
                      </div>
                      <a
                        href={form.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5"
                        style={{ background: '#FFFFFF', color: '#0B1D3A', border: '1px solid #DAEEFF' }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> ดาวน์โหลด
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANEL 2: SUBMIT */}
        {activeSubTab === 'submit' && (
          <div className="max-w-xl mx-auto">
            {!user ? (
              <EmptyState icon={<UploadCloud className="w-12 h-12 stroke-[1.5]" />} title="เข้าสู่ระบบเพื่อยื่นคำขอ" body="จำเป็นต้องลงชื่อเข้าใช้ก่อนยื่นคำขอขึ้นทะเบียนทรัพย์สินทางปัญญา" dashed />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-base font-black mb-1" style={{ color: '#0B1D3A' }}>ยื่นคำขอขึ้นทะเบียนผลงาน</h3>
                  <p className="text-xs font-medium" style={{ color: '#64748B' }}>แจ้งรายละเอียดผลงานเบื้องต้น แอดมินจะเตรียมเอกสารส่งกรมทรัพย์สินฯ ต่อไป</p>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold" style={{ background: '#FFF1F2', color: '#9F1239', border: '1px solid #FECDD3' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                    <CheckCircle className="w-4 h-4 shrink-0" /> {formSuccess}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>ชื่อผลงานทรัพย์สินทางปัญญา *</label>
                    <Input
                      type="text" required
                      placeholder="ระบุชื่อผลงาน นวัตกรรม หรือสิ่งประดิษฐ์..."
                      value={title} onChange={(e) => setTitle(e.target.value)}
                      className={inputBase} style={inputSty}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>ประเภทผลงาน *</label>
                    <Select
                      value={ipType}
                      onValueChange={(v) => setIpType(v ?? 'อนุสิทธิบัตร')}
                      items={[
                        { value: 'อนุสิทธิบัตร', label: 'อนุสิทธิบัตร (Petty Patent)' },
                        { value: 'สิทธิบัตร', label: 'สิทธิบัตรการประดิษฐ์ (Patent)' },
                        { value: 'ลิขสิทธิ์', label: 'ลิขสิทธิ์ (Copyright)' },
                        { value: 'เครื่องหมายการค้า', label: 'เครื่องหมายการค้า (Trademark)' },
                      ]}
                    >
                      <SelectTrigger className={inputBase + ' w-full'} style={inputSty}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="อนุสิทธิบัตร">อนุสิทธิบัตร (Petty Patent)</SelectItem>
                        <SelectItem value="สิทธิบัตร">สิทธิบัตรการประดิษฐ์ (Patent)</SelectItem>
                        <SelectItem value="ลิขสิทธิ์">ลิขสิทธิ์ (Copyright)</SelectItem>
                        <SelectItem value="เครื่องหมายการค้า">เครื่องหมายการค้า (Trademark)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit" disabled={isSubmitting}
                  className="w-full py-3 h-auto rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)', color: '#FFFFFF' }}
                >
                  {isSubmitting ? 'กำลังยื่นเรื่อง...' : 'ส่งคำขอขึ้นทะเบียน IP →'}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* PANEL 3: STATUS */}
        {activeSubTab === 'status' && (
          <div>
            {!user ? (
              <EmptyState icon={<Clock className="w-12 h-12 stroke-[1.5]" />} title="เข้าสู่ระบบเพื่อติดตามสถานะ" body="จำเป็นต้องลงชื่อเข้าใช้ก่อนดูประวัติคำขอ" dashed />
            ) : applications.length === 0 ? (
              <EmptyState icon={<Award className="w-10 h-10 stroke-[1.5]" />} title="ยังไม่มีประวัติการยื่นคำขอ" />
            ) : (
              <div className="space-y-5">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-6 rounded-2xl space-y-5 transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}
                  >
                    {/* Header row */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-black text-sm" style={{ color: '#0B1D3A' }}>{app.title}</h4>
                        <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                          <span
                            className="inline-block text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(14,165,160,0.12)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.3)' }}
                          >
                            {app.ip_type}
                          </span>
                          <span className="text-[10px] font-semibold" style={{ color: '#94A3B8' }}>
                            ยื่นเมื่อ {new Date(app.created_at).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <StatusBadge status={app.status} />
                        {app.request_number && (
                          <div className="text-[10px] font-bold mt-1.5" style={{ color: '#64748B' }}>
                            เลขคำขอ: <span className="font-mono">{app.request_number}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #DAEEFF' }}>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] mb-3" style={{ color: '#0EA5A0' }}>
                        ความคืบหน้าการพิจารณา
                      </p>
                      <TimelineSteps status={app.status} />
                    </div>

                    {/* Notes */}
                    {(app.current_step || app.admin_notes || app.transferred_to_catalog) && (
                      <div className="rounded-xl p-4 space-y-2 text-xs font-medium" style={{ background: '#FFFFFF', border: '1px solid #DAEEFF', color: '#475569' }}>
                        {app.current_step && (
                          <div><span className="font-bold" style={{ color: '#0B1D3A' }}>สถานะปัจจุบัน:</span> {app.current_step}</div>
                        )}
                        {app.admin_notes && (
                          <div><span className="font-bold" style={{ color: '#0B1D3A' }}>บันทึกจากเจ้าหน้าที่:</span> <em>{app.admin_notes}</em></div>
                        )}
                        {app.transferred_to_catalog && (
                          <div className="flex items-center gap-1.5 font-bold pt-1" style={{ color: '#065F46' }}>
                            <CheckCircle className="w-3.5 h-3.5" />
                            ผลงานนี้โอนเข้าสู่คลังทรัพย์สินทางปัญญาเรียบร้อยแล้ว
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ContentPanel>
    </div>
  )
}
