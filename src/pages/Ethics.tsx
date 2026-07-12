import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { 
  FileText, 
  UploadCloud, 
  Clock, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  AlertCircle,
  ExternalLink,
  Clipboard,
  Briefcase,
  UserCheck
} from 'lucide-react'

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

interface EthicsAttachment {
  id: string
  submission_id: string
  file_url: string
  file_name?: string
  file_type?: string
}

// ── Shared PageHeader (same design language as Clinic) ────────────────────────
const PageHeader: React.FC<{
  title: string
  subtitle: string
  extraBadge?: string
  tabs: { key: string; icon: React.ReactNode; label: string }[]
  activeTab: string
  onTabChange: (tab: string) => void
}> = ({ title, subtitle, extraBadge, tabs, activeTab, onTabChange }) => (
  <div
    className="relative overflow-hidden rounded-2xl mb-8"
    style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 60%, #0E3251 100%)' }}
  >
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 80% 20%, rgba(14,165,160,0.25) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(14,165,160,0.12) 0%, transparent 50%)',
      }}
    />
    <div className="relative px-8 pt-8 pb-0">
      {extraBadge && (
        <span
          className="inline-block mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
          style={{ background: 'rgba(14,165,160,0.18)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.4)' }}
        >
          {extraBadge}
        </span>
      )}
      <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-1">{title}</h1>
      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>{subtitle}</p>
      <div className="flex gap-2 mt-7 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all duration-200 shrink-0"
              style={{
                background: isActive ? '#F0F7FF' : 'rgba(255,255,255,0.07)',
                color: isActive ? '#0B1D3A' : 'rgba(255,255,255,0.65)',
                borderBottom: isActive ? '2px solid #0EA5A0' : '2px solid transparent',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  </div>
)

const ContentPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="bg-white rounded-2xl shadow-sm"
    style={{ border: '1px solid #E2EDF8', borderLeft: '4px solid #0EA5A0' }}
  >
    <div className="p-8">{children}</div>
  </div>
)

const EthicsStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode }> = {
    'ยื่นแล้ว': { bg: '#F8FAFC', color: '#475569', border: '#CBD5E1', icon: <Clock className="w-3.5 h-3.5" /> },
    'กำลังตรวจ': { bg: '#FAF5FF', color: '#7E22CE', border: '#D8B4FE', icon: <Clock className="w-3.5 h-3.5" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} /> },
    'รอแก้ไข': { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    'อนุมัติ': { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    'ไม่อนุมัติ': { bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3', icon: <XCircle className="w-3.5 h-3.5" /> },
  }
  const s = map[status] ?? { bg: '#F8FAFC', color: '#475569', border: '#CBD5E1', icon: <HelpCircle className="w-3.5 h-3.5" /> }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.icon} {status}
    </span>
  )
}

const inputBase = "w-full text-sm px-4 py-2.5 rounded-xl focus:outline-none transition-all duration-200"
const inputSty = { border: '1.5px solid #CBD5E1', background: '#FAFCFF' }

export const Ethics: React.FC = () => {
  const { user, profile } = useAuth()
  const [activeSubTab, setActiveSubTab] = useState<'forms' | 'submit' | 'status' | 'review'>('forms')
  
  const [forms, setForms] = useState<DownloadableForm[]>([])
  const [submissions, setSubmissions] = useState<EthicsSubmission[]>([])
  const [attachments, setAttachments] = useState<EthicsAttachment[]>([])
  const [reviewSubmissions, setReviewSubmissions] = useState<any[]>([])

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewStatus, setReviewStatus] = useState('กำลังตรวจ')

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

  const fetchReviewSubmissions = async () => {
    if (!user) return
    try {
      let query = supabase.from('ethics_submissions').select('*').order('created_at', { ascending: false })
      if (profile?.role === 'expert') query = query.eq('assigned_reviewer_id', user.id)
      const { data, error } = await query
      if (error) throw error
      setReviewSubmissions(data || [])
    } catch (err) { console.error(err) }
  }

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase.from('ethics_attachments').select('*')
      if (error) throw error
      setAttachments(data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchForms(); fetchAttachments() }, [user])
  useEffect(() => {
    if (activeSubTab === 'status') fetchSubmissions()
    if (activeSubTab === 'review') fetchReviewSubmissions()
  }, [activeSubTab, user, profile])

  useEffect(() => {
    if (!user) return
    const s = supabase.channel('ethics-sub-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_submissions' }, () => { fetchSubmissions(); fetchReviewSubmissions() }).subscribe()
    const a = supabase.channel('ethics-att-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_attachments' }, () => fetchAttachments()).subscribe()
    return () => { supabase.removeChannel(s); supabase.removeChannel(a) }
  }, [user, profile])

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
          const storagePath = `ethics/${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
          const { error: uploadError } = await supabase.storage.from('wisdom-private').upload(storagePath, file)
          if (uploadError) throw uploadError
          const { error: attachError } = await supabase.from('ethics_attachments').insert({ submission_id: submissionId, file_url: storagePath, file_name: file.name, file_type: file.type })
          if (attachError) throw attachError
        }
      }
      setFormSuccess('ยื่นคำขอรับการพิจารณาจริยธรรมเรียบร้อยแล้ว! ติดตามสถานะได้ที่แท็บติดตามสถานะ')
      setTitle(''); setDesc(''); setFiles(null)
      const fileInput = document.getElementById('ethics-files') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err: any) { setFormError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล') } finally { setIsSubmitting(false) }
  }

  const handleDownloadFile = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('wisdom-private').createSignedUrl(path, 60)
      if (error) throw error
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    } catch (err: any) { alert(`ไม่สามารถเปิดไฟล์แนบนี้ได้: ${err.message}`) }
  }

  const handleSaveReview = async (subId: string) => {
    try {
      const { error } = await supabase.from('ethics_submissions').update({ status: reviewStatus, reviewer_notes: reviewNotes }).eq('id', subId)
      if (error) throw error
      setEditingSubId(null); fetchReviewSubmissions()
      alert('บันทึกผลการพิจารณาเรียบร้อยแล้ว!')
    } catch (err: any) { alert(`เกิดข้อผิดพลาด: ${err.message}`) }
  }

  const isReviewTabVisible = profile?.role === 'expert' || profile?.role === 'admin'

  const tabsConfig = [
    { key: 'forms', icon: <FileText className="w-4 h-4" />, label: 'ดาวน์โหลดแบบฟอร์ม' },
    { key: 'submit', icon: <UploadCloud className="w-4 h-4" />, label: 'ยื่นเอกสารออนไลน์' },
    { key: 'status', icon: <Clock className="w-4 h-4" />, label: 'ติดตามสถานะคำขอ' },
    ...(isReviewTabVisible ? [{ key: 'review', icon: <UserCheck className="w-4 h-4" />, label: `รีวิวจริยธรรม (${reviewSubmissions.length})` }] : []),
  ]

  const EmptyState: React.FC<{ icon: React.ReactNode; title: string; body?: string; dashed?: boolean }> = ({ icon, title, body, dashed }) => (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
      style={dashed ? { border: '2px dashed #CBD5E1', borderRadius: '1rem' } : undefined}
    >
      <div style={{ color: '#CBD5E1' }}>{icon}</div>
      <div>
        <p className="text-sm font-bold" style={{ color: '#0B1D3A' }}>{title}</p>
        {body && <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{body}</p>}
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      <PageHeader
        title="จริยธรรมการวิจัย"
        subtitle="Research Ethics — ยื่น ติดตาม และพิจารณาคำขอรับรองจริยธรรม"
        extraBadge="Ethics Review System"
        tabs={tabsConfig}
        activeTab={activeSubTab}
        onTabChange={(t) => setActiveSubTab(t as any)}
      />

      <ContentPanel>
        {/* PANEL 1: FORMS */}
        {activeSubTab === 'forms' && (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>แบบฟอร์มทางการ</p>
              <h3 className="text-base font-black" style={{ color: '#0B1D3A' }}>รายการแบบฟอร์มยื่นขอรับรองจริยธรรม</h3>
            </div>
            {forms.length === 0 ? (
              <EmptyState icon={<Clipboard className="w-10 h-10 stroke-[1.5]" />} title="ยังไม่มีแบบฟอร์มอัปโหลด" body="ติดต่องานวิจัยสถาบันเพื่อรับแบบฟอร์มทางอีเมล" dashed />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="flex items-center justify-between p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#0B1D3A' }}>
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate" style={{ color: '#0B1D3A' }} title={form.title}>{form.title}</p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#94A3B8' }}>แบบฟอร์มอย่างเป็นทางการ</p>
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
            )}
          </div>
        )}

        {/* PANEL 2: SUBMIT */}
        {activeSubTab === 'submit' && (
          <div className="max-w-xl mx-auto">
            {!user ? (
              <EmptyState icon={<UploadCloud className="w-12 h-12 stroke-[1.5]" />} title="เข้าสู่ระบบเพื่อยื่นเอกสาร" body="จำเป็นต้องลงชื่อเข้าใช้ก่อนอัปโหลดไฟล์และยื่นโครงร่างวิจัย" dashed />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-base font-black mb-1" style={{ color: '#0B1D3A' }}>ยื่นโครงร่างวิจัยขอรับการพิจารณา</h3>
                  <p className="text-xs font-medium" style={{ color: '#64748B' }}>แนบไฟล์แบบฟอร์มที่ระบุรายละเอียดครบถ้วนและลงลายมือชื่อแล้ว</p>
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
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>ชื่อโครงร่างวิจัย *</label>
                    <input type="text" required placeholder="ระบุชื่อโครงการวิจัย (ภาษาไทยและอังกฤษ)..." value={title} onChange={(e) => setTitle(e.target.value)} className={inputBase} style={inputSty} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>รายละเอียดสรุปย่อ / บทคัดย่อ</label>
                    <textarea rows={3} placeholder="วัตถุประสงค์หรือรายละเอียดเบื้องต้นของโครงการ..." value={desc} onChange={(e) => setDesc(e.target.value)} className={inputBase + ' resize-none'} style={inputSty} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0B1D3A' }}>อัปโหลดเอกสารประกอบ * <span className="font-normal" style={{ color: '#94A3B8' }}>(เลือกได้หลายไฟล์)</span></label>
                    <input type="file" id="ethics-files" multiple required accept=".pdf,.doc,.docx" onChange={(e) => setFiles(e.target.files)} className={inputBase} style={inputSty} />
                    <p className="text-[10px] mt-1" style={{ color: '#94A3B8' }}>รองรับ PDF, Word เท่านั้น — ขนาดรวมไม่เกิน 25 MB</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)', color: '#FFFFFF' }}
                >
                  {isSubmitting ? 'กำลังอัปโหลดเอกสาร...' : 'ส่งคำขอยื่นจริยธรรม →'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* PANEL 3: STATUS */}
        {activeSubTab === 'status' && (
          <div>
            {!user ? (
              <EmptyState icon={<Clock className="w-12 h-12 stroke-[1.5]" />} title="เข้าสู่ระบบเพื่อติดตามสถานะ" body="จำเป็นต้องลงชื่อเข้าใช้ก่อนดูประวัติคำขอ" dashed />
            ) : submissions.length === 0 ? (
              <EmptyState icon={<Clipboard className="w-10 h-10 stroke-[1.5]" />} title="ยังไม่มีประวัติการยื่นคำขอ" />
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #E8F0F8' }}>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr style={{ background: '#F0F7FF', borderBottom: '1px solid #DAEEFF' }}>
                      {['ชื่อโครงร่างวิจัย','เอกสารแนบ','สถานะ','ความเห็นผู้ทรงคุณวุฒิ','วันที่ยื่น'].map(h => (
                        <th key={h} className="py-3 px-4 font-extrabold uppercase text-[10px] tracking-wider" style={{ color: '#64748B' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#E8F0F8' }}>
                    {submissions.map((sub) => {
                      const subAttach = attachments.filter(a => a.submission_id === sub.id)
                      return (
                        <tr key={sub.id} className="transition-colors hover:bg-blue-50/30">
                          <td className="py-3 px-4">
                            <div className="font-bold" style={{ color: '#0B1D3A' }}>{sub.project_title}</div>
                            {sub.project_description && <p className="text-[10px] mt-1" style={{ color: '#94A3B8' }}>{sub.project_description}</p>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1.5 max-w-[180px]">
                              {subAttach.map((at) => (
                                <button key={at.id} onClick={() => handleDownloadFile(at.file_url)} className="inline-flex items-center gap-1 text-[10px] font-bold text-left hover:underline truncate cursor-pointer" style={{ color: '#0EA5A0' }} title={at.file_name}>
                                  <FileText className="w-3.5 h-3.5 shrink-0" /> {at.file_name}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap"><EthicsStatusBadge status={sub.status} /></td>
                          <td className="py-3 px-4 italic font-medium" style={{ color: '#64748B' }}>{sub.reviewer_notes || '—'}</td>
                          <td className="py-3 px-4 font-semibold" style={{ color: '#94A3B8' }}>{new Date(sub.created_at).toLocaleDateString('th-TH')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PANEL 4: REVIEW (EXPERT/ADMIN) */}
        {activeSubTab === 'review' && isReviewTabVisible && (
          <div>
            <div className="mb-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>คิวงานพิจารณา</p>
              <h3 className="text-base font-black flex items-center gap-2" style={{ color: '#0B1D3A' }}>
                <Briefcase className="w-5 h-5" style={{ color: '#7E22CE' }} />
                กล่องงานพิจารณาจริยธรรมของคุณ
              </h3>
            </div>
            {reviewSubmissions.length === 0 ? (
              <EmptyState icon={<UserCheck className="w-10 h-10 stroke-[1.5]" />} title="ไม่มีรายการในคิวขณะนี้" body="เมื่อแอดมินมอบหมายงาน รายการจะปรากฏที่นี่" dashed />
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #E8F0F8' }}>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr style={{ background: '#F0F7FF', borderBottom: '1px solid #DAEEFF' }}>
                      {['โครงร่างวิจัย / เอกสาร','สถานะ','ความเห็นรีวิว','จัดการ'].map(h => (
                        <th key={h} className="py-3 px-4 font-extrabold uppercase text-[10px] tracking-wider" style={{ color: '#64748B' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white" style={{ borderColor: '#E8F0F8' }}>
                    {reviewSubmissions.map((sub) => {
                      const subAttach = attachments.filter(a => a.submission_id === sub.id)
                      const isEditing = editingSubId === sub.id
                      return (
                        <tr key={sub.id} className="transition-colors hover:bg-blue-50/30">
                          <td className="py-3 px-4 max-w-[280px]">
                            <div className="font-bold" style={{ color: '#0B1D3A' }}>{sub.project_title}</div>
                            {sub.project_description && <p className="text-[10px] mt-1" style={{ color: '#94A3B8' }}>{sub.project_description}</p>}
                            {subAttach.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {subAttach.map((at) => (
                                  <button key={at.id} onClick={() => handleDownloadFile(at.file_url)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold cursor-pointer transition-colors" style={{ background: '#FAF5FF', color: '#7E22CE', border: '1px solid #D8B4FE' }} title={at.file_name}>
                                    <FileText className="w-3 h-3" /> {at.file_name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isEditing ? (
                              <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} className="px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF', color: '#0B1D3A' }}>
                                {['กำลังตรวจ','รอแก้ไข','อนุมัติ','ไม่อนุมัติ'].map(s => <option key={s}>{s}</option>)}
                              </select>
                            ) : (
                              <EthicsStatusBadge status={sub.status} />
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="เขียนความเห็น คำแนะนำ หรือจุดที่ต้องแก้ไข..." className="w-full px-3 py-2 rounded-xl text-xs resize-none" rows={2} style={{ border: '1.5px solid #CBD5E1', background: '#FAFCFF' }} />
                            ) : (
                              <span className="italic font-medium" style={{ color: '#64748B' }}>{sub.reviewer_notes || '—'}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex gap-1.5 justify-center">
                                <button onClick={() => handleSaveReview(sub.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7' }}>บันทึก</button>
                                <button onClick={() => setEditingSubId(null)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors" style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1' }}>ยกเลิก</button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingSubId(sub.id); setReviewStatus(sub.status); setReviewNotes(sub.reviewer_notes || '') }} className="px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-200 hover:-translate-y-0.5" style={{ background: '#FAF5FF', color: '#7E22CE', border: '1px solid #D8B4FE' }}>
                                พิจารณาผล
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </ContentPanel>
    </div>
  )
}
