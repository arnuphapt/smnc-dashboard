import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useLookups } from '../context/LookupContext'
import { 
  Plus, Edit2, Trash2, Settings, Users, BookOpen, X, Check,
  Calendar, Award, FileText, Clipboard, ExternalLink
} from 'lucide-react'
import { WisdomItem } from './Dashboard'
import { Profile } from '../context/AuthContext'

export const AdminPanel: React.FC = () => {
  const { options, getOptionsByCategory, refreshOptions } = useLookups()

  // Sub-tabs: 'items' | 'lookups' | 'users' | 'clinic' | 'ethics' | 'ip'
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'lookups' | 'users' | 'clinic' | 'ethics' | 'ip'>('items')

  // Loading states
  const [itemsLoading, setItemsLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Data states
  const [items, setItems] = useState<WisdomItem[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])

  // Phase 2 Data States
  const [appointments, setAppointments] = useState<any[]>([])
  const [clinicEvents, setClinicEvents] = useState<any[]>([])
  const [clinicDesc, setClinicDesc] = useState('')
  const [ethicsSubmissions, setEthicsSubmissions] = useState<any[]>([])
  const [downloadableForms, setDownloadableForms] = useState<any[]>([])
  const [ipApplications, setIpApplications] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])

  // Phase 2 Form & Action States
  const [newEvTitle, setNewEvTitle] = useState('')
  const [newEvDesc, setNewEvDesc] = useState('')
  const [newEvDate, setNewEvDate] = useState('')
  const [newEvLoc, setNewEvLoc] = useState('')
  const [newEvCap, setNewEvCap] = useState('')

  const [newFormTitle, setNewFormTitle] = useState('')
  const [newFormCat, setNewFormCat] = useState<'ethics' | 'ip'>('ethics')
  const [newFormUrl, setNewFormUrl] = useState('')

  const [appEditing, setAppEditing] = useState<any | null>(null)
  const [appNotesInput, setAppNotesInput] = useState('')
  const [appStatusInput, setAppStatusInput] = useState('pending')

  const [subEditing, setSubEditing] = useState<any | null>(null)
  const [subReviewerInput, setSubReviewerInput] = useState('')
  const [subNotesInput, setSubNotesInput] = useState('')
  const [subStatusInput, setSubStatusInput] = useState('ยื่นแล้ว')

  const [ipEditing, setIpEditing] = useState<any | null>(null)
  const [ipReqNumInput, setIpReqNumInput] = useState('')
  const [ipStepInput, setIpStepInput] = useState('')
  const [ipNotesInput, setIpNotesInput] = useState('')
  const [ipStatusInput, setIpStatusInput] = useState('ยื่นคำขอ')

  // Items Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WisdomItem | null>(null)
  
  const [formCategory, setFormCategory] = useState<WisdomItem['category']>('research')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAuthors, setFormAuthors] = useState('')
  const [formIsPublic, setFormIsPublic] = useState(false)
  
  // Storage files
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [docFile, setDocFile] = useState<File | null>(null)

  // Dynamic Metadata Fields
  const [metaDept, setMetaDept] = useState('')
  const [metaSubtype, setMetaSubtype] = useState('')
  const [metaYear, setMetaYear] = useState('')
  const [metaJournal, setMetaJournal] = useState('')
  const [metaRegNum, setMetaRegNum] = useState('')
  const [metaRegDate, setMetaRegDate] = useState('')
  const [metaOrganizer, setMetaOrganizer] = useState('')
  const [metaOrgUsed, setMetaOrgUsed] = useState('')
  const [metaImpact, setMetaImpact] = useState('')

  // Lookups Form State
  const [lookupCategory, setLookupCategory] = useState('research_type')
  const [lookupValue, setLookupValue] = useState('')
  const [lookupLabel, setLookupLabel] = useState('')
  const [lookupSortOrder, setLookupSortOrder] = useState(0)

  // Fetchers for Phase 2
  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase.from('appointments').select('*').order('requested_at', { ascending: false })
      if (error) throw error
      setAppointments(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchClinicEvents = async () => {
    try {
      const { data, error } = await supabase.from('clinic_events').select('*').order('event_date', { ascending: true })
      if (error) throw error
      setClinicEvents(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchClinicDesc = async () => {
    try {
      const { data } = await supabase.from('clinic_info').select('value').eq('key', 'description').maybeSingle()
      if (data) setClinicDesc(data.value)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchEthicsSubmissions = async () => {
    try {
      const { data, error } = await supabase.from('ethics_submissions').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setEthicsSubmissions(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchDownloadableForms = async () => {
    try {
      const { data, error } = await supabase.from('downloadable_forms').select('*').order('sort_order', { ascending: true })
      if (error) throw error
      setDownloadableForms(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchIpApplications = async () => {
    try {
      const { data, error } = await supabase.from('ip_applications').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setIpApplications(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase.from('ethics_attachments').select('*')
      if (error) throw error
      setAttachments(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchItems()
    fetchProfiles()

    const itemsChannel = supabase
      .channel('admin-items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wisdom_items' }, () => {
        fetchItems()
      })
      .subscribe()

    const profilesChannel = supabase
      .channel('admin-profiles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfiles()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(itemsChannel)
      supabase.removeChannel(profilesChannel)
    }
  }, [])

  // Hook for sub-tab specific fetches and realtime
  useEffect(() => {
    if (activeSubTab === 'clinic') {
      fetchAppointments()
      fetchClinicEvents()
      fetchClinicDesc()

      const appChan = supabase.channel('admin-app-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => { fetchAppointments() }).subscribe()
      const evChan = supabase.channel('admin-ev-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_events' }, () => { fetchClinicEvents() }).subscribe()
      return () => {
        supabase.removeChannel(appChan)
        supabase.removeChannel(evChan)
      }
    }
    if (activeSubTab === 'ethics') {
      fetchEthicsSubmissions()
      fetchDownloadableForms()
      fetchAttachments()

      const ethicsChan = supabase.channel('admin-ethics-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_submissions' }, () => { fetchEthicsSubmissions() }).subscribe()
      const formsChan = supabase.channel('admin-forms-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'downloadable_forms' }, () => { fetchDownloadableForms() }).subscribe()
      const attachChan = supabase.channel('admin-attach-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_attachments' }, () => { fetchAttachments() }).subscribe()
      return () => {
        supabase.removeChannel(ethicsChan)
        supabase.removeChannel(formsChan)
        supabase.removeChannel(attachChan)
      }
    }
    if (activeSubTab === 'ip') {
      fetchIpApplications()

      const ipChan = supabase.channel('admin-ip-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'ip_applications' }, () => { fetchIpApplications() }).subscribe()
      return () => {
        supabase.removeChannel(ipChan)
      }
    }
  }, [activeSubTab])

  const fetchItems = async () => {
    setItemsLoading(true)
    try {
      const { data, error } = await supabase
        .from('wisdom_items')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setItems((data as WisdomItem[]) || [])
    } catch (err) {
      console.error('Error fetching admin items:', err)
    } finally {
      setItemsLoading(false)
    }
  }

  const fetchProfiles = async () => {
    setUsersLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProfiles((data as Profile[]) || [])
    } catch (err) {
      console.error('Error fetching profiles:', err)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleOpenAddForm = () => {
    setEditingItem(null)
    setFormCategory('research')
    setFormTitle('')
    setFormDescription('')
    setFormAuthors('')
    setFormIsPublic(false)
    setImageFile(null)
    setDocFile(null)
    
    setMetaDept('')
    setMetaSubtype('')
    setMetaYear('')
    setMetaJournal('')
    setMetaRegNum('')
    setMetaRegDate('')
    setMetaOrganizer('')
    setMetaOrgUsed('')
    setMetaImpact('')

    setIsFormOpen(true)
  }

  const handleOpenEditForm = (item: WisdomItem) => {
    setEditingItem(item)
    setFormCategory(item.category)
    setFormTitle(item.title)
    setFormDescription(item.description || '')
    setFormAuthors(item.authors || '')
    setFormIsPublic(item.is_public)
    setImageFile(null)
    setDocFile(null)

    setMetaDept(item.metadata.department || '')
    setMetaSubtype(
      item.metadata.research_type || 
      item.metadata.ip_type || 
      item.metadata.award_level || 
      item.metadata.utilization_type || ''
    )
    setMetaYear(item.metadata.year || '')
    setMetaJournal(item.metadata.journal_name || '')
    setMetaRegNum(item.metadata.registration_number || '')
    setMetaRegDate(item.metadata.registration_date || '')
    setMetaOrganizer(item.metadata.organizer || '')
    setMetaOrgUsed(item.metadata.organization_used || '')
    setMetaImpact(item.metadata.impact_summary || '')

    setIsFormOpen(true)
  }

  const uploadFile = async (file: File, folder: string, isPublic: boolean): Promise<string> => {
    const bucket = isPublic ? 'wisdom-public' : 'wisdom-private'
    const fileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    
    const { error } = await supabase.storage.from(bucket).upload(fileName, file)
    if (error) throw error
    return fileName
  }

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      let imageUrl = editingItem?.image_url || ''
      let fileUrl = editingItem?.file_url || ''

      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'images', formIsPublic)
      }
      if (docFile) {
        fileUrl = await uploadFile(docFile, 'files', formIsPublic)
      }

      const metadata: any = {
        department: metaDept,
        year: metaYear
      }

      if (formCategory === 'research') {
        metadata.research_type = metaSubtype
        metadata.journal_name = metaJournal
      } else if (formCategory === 'innovation') {
        metadata.research_type = metaSubtype
      } else if (formCategory === 'intellectual_property') {
        metadata.ip_type = metaSubtype
        metadata.registration_number = metaRegNum
        metadata.registration_date = metaRegDate
      } else if (formCategory === 'award') {
        metadata.award_level = metaSubtype
        metadata.organizer = metaOrganizer
      } else if (formCategory === 'utilization') {
        metadata.utilization_type = metaSubtype
        metadata.organization_used = metaOrgUsed
        metadata.impact_summary = metaImpact
      }

      const rowData = {
        category: formCategory,
        title: formTitle,
        description: formDescription,
        authors: formAuthors,
        is_public: formIsPublic,
        image_url: imageUrl || null,
        file_url: fileUrl || null,
        metadata,
        updated_at: new Date().toISOString()
      }

      if (editingItem) {
        const { error } = await supabase
          .from('wisdom_items')
          .update(rowData)
          .eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { data: userData } = await supabase.auth.getUser()
        const { error } = await supabase
          .from('wisdom_items')
          .insert({
            ...rowData,
            created_by: userData.user?.id
          })
        if (error) throw error
      }

      setIsFormOpen(false)
      fetchItems()
    } catch (err: any) {
      alert(`Error saving item: ${err.message}`)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผลงานนี้ออกจากระบบ?')) return
    try {
      const { error } = await supabase
        .from('wisdom_items')
        .delete()
        .eq('id', id)
      if (error) throw error
      fetchItems()
    } catch (err: any) {
      alert(`Error deleting item: ${err.message}`)
    }
  }

  const handleAddLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookupValue || !lookupLabel) return
    try {
      const { error } = await supabase
        .from('lookup_options')
        .insert({
          category: lookupCategory,
          value: lookupValue,
          label: lookupLabel,
          sort_order: Number(lookupSortOrder)
        })
      if (error) throw error
      setLookupValue('')
      setLookupLabel('')
      setLookupSortOrder(0)
      refreshOptions()
    } catch (err: any) {
      alert(`Error creating lookup: ${err.message}`)
    }
  }

  const handleDeleteLookup = async (id: string) => {
    if (!window.confirm('คุณแน่ใจว่าต้องการลบตัวเลือกคัดกรองนี้?')) return
    try {
      const { error } = await supabase
        .from('lookup_options')
        .delete()
        .eq('id', id)
      if (error) throw error
      refreshOptions()
    } catch (err: any) {
      alert(`Error deleting lookup: ${err.message}`)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
      if (error) throw error
      fetchProfiles()
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`)
    }
  }

  // Phase 2 Action Handlers

  // Clinic description
  const handleUpdateClinicDesc = async () => {
    try {
      const { error } = await supabase
        .from('clinic_info')
        .upsert({ key: 'description', value: clinicDesc }, { onConflict: 'key' })
      if (error) throw error
      alert('บันทึกรายละเอียดคลินิกเรียบร้อยแล้ว!')
    } catch (err: any) {
      alert(`Error updating clinic info: ${err.message}`)
    }
  }

  // Clinic Add Event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvTitle || !newEvDate) return
    try {
      const { error } = await supabase.from('clinic_events').insert({
        title: newEvTitle,
        description: newEvDesc,
        event_date: new Date(newEvDate).toISOString(),
        location: newEvLoc,
        capacity: newEvCap ? parseInt(newEvCap) : null
      })
      if (error) throw error
      setNewEvTitle('')
      setNewEvDesc('')
      setNewEvDate('')
      setNewEvLoc('')
      setNewEvCap('')
      fetchClinicEvents()
      alert('เพิ่มกิจกรรมเรียบร้อย!')
    } catch (err: any) {
      alert(`Error adding event: ${err.message}`)
    }
  }

  // Clinic Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('คุณแน่ใจว่าต้องการลบกิจกรรมสัมมนานี้?')) return
    try {
      const { error } = await supabase.from('clinic_events').delete().eq('id', id)
      if (error) throw error
      fetchClinicEvents()
    } catch (err: any) {
      alert(`Error deleting event: ${err.message}`)
    }
  }

  // Update Appointment Status and Notes
  const handleUpdateAppStatus = async (appId: string, status: string, notes: string) => {
    try {
      const { error } = await supabase.from('appointments').update({ status, admin_notes: notes }).eq('id', appId)
      if (error) throw error
      setAppEditing(null)
      fetchAppointments()
      alert('อัปเดตสถานะนัดหมายเรียบร้อยแล้ว!')
    } catch (err: any) {
      alert(`Error updating appointment: ${err.message}`)
    }
  }

  // Add Downloadable Form
  const handleAddDownloadableForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFormTitle || !newFormUrl) return
    try {
      const { error } = await supabase.from('downloadable_forms').insert({
        title: newFormTitle,
        category: newFormCat,
        file_url: newFormUrl
      })
      if (error) throw error
      setNewFormTitle('')
      setNewFormUrl('')
      fetchDownloadableForms()
      alert('เพิ่มฟอร์มดาวน์โหลดเรียบร้อย!')
    } catch (err: any) {
      alert(`Error adding downloadable form: ${err.message}`)
    }
  }

  // Delete Downloadable Form
  const handleDeleteDownloadableForm = async (id: string) => {
    if (!window.confirm('คุณแน่ใจว่าต้องการลบแบบฟอร์มนี้?')) return
    try {
      const { error } = await supabase.from('downloadable_forms').delete().eq('id', id)
      if (error) throw error
      fetchDownloadableForms()
    } catch (err: any) {
      alert(`Error deleting downloadable form: ${err.message}`)
    }
  }

  // Update Ethics Submission Reviewer, Status, Notes
  const handleUpdateSubmission = async (subId: string, reviewerId: string | null, status: string, notes: string) => {
    try {
      const { error } = await supabase.from('ethics_submissions').update({
        assigned_reviewer_id: reviewerId || null,
        status,
        reviewer_notes: notes
      }).eq('id', subId)
      if (error) throw error
      setSubEditing(null)
      fetchEthicsSubmissions()
      alert('อัปเดตข้อมูลการยื่นขอจริยธรรมเรียบร้อย!')
    } catch (err: any) {
      alert(`Error updating submission: ${err.message}`)
    }
  }

  // Update IP Application Status, Step, Notes, Req Num
  const handleUpdateIPApp = async (ipId: string, status: string, step: string, notes: string, reqNum: string) => {
    try {
      const { error } = await supabase.from('ip_applications').update({
        status,
        current_step: step,
        admin_notes: notes,
        request_number: reqNum
      }).eq('id', ipId)
      if (error) throw error
      setIpEditing(null)
      fetchIpApplications()
      alert('อัปเดตคำขอทรัพย์สินทางปัญญาเรียบร้อย!')
    } catch (err: any) {
      alert(`Error updating IP application: ${err.message}`)
    }
  }

  // Transfer IP to main wisdom catalog
  const handleTransferToCatalog = async (app: any) => {
    if (!app.request_number) {
      alert('โปรดระบุเลขที่คำขอสิทธิบัตร/อนุสิทธิบัตรก่อนทำการโอนเข้าคลังหลัก')
      return
    }
    if (!window.confirm('ยืนยันการโอนย้ายคำขอนี้เข้าสู่ คลังทรัพย์สินทางปัญญาหลัก?')) return
    try {
      const applicantEmail = profiles.find(p => p.id === app.applicant_id)?.email || 'คณาจารย์'
      
      const { error: insertError } = await supabase.from('wisdom_items').insert({
        category: 'intellectual_property',
        title: app.title,
        description: `โอนย้ายจากใบสมัครยื่นขอจดทะเบียนผลงานของ ${applicantEmail}. ${app.admin_notes || ''}`,
        authors: applicantEmail,
        is_public: true,
        metadata: {
          ip_type: app.ip_type,
          registration_number: app.request_number,
          registration_date: new Date().toLocaleDateString('th-TH')
        }
      })
      if (insertError) throw insertError

      const { error: updateError } = await supabase.from('ip_applications').update({
        transferred_to_catalog: true,
        status: 'อนุมัติ'
      }).eq('id', app.id)
      if (updateError) throw updateError

      alert('โอนย้ายผลงานเข้าสู่คลังทรัพย์สินทางปัญญาหลักเรียบร้อยแล้ว!')
      fetchIpApplications()
    } catch (err: any) {
      alert(`Error transferring to catalog: ${err.message}`)
    }
  }

  const handleDownloadPrivateFile = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('wisdom-private').createSignedUrl(path, 60)
      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err: any) {
      alert(`ไม่สามารถดาวน์โหลดไฟล์ได้: ${err.message}`)
    }
  }

  const getSubtypeCategoryForForm = () => {
    switch (formCategory) {
      case 'research': return 'research_type'
      case 'innovation': return 'research_type'
      case 'intellectual_property': return 'ip_type'
      case 'award': return 'award_level'
      case 'utilization': return 'utilization_type'
      default: return ''
    }
  };

  const getSubtypeLabelForForm = () => {
    switch (formCategory) {
      case 'research': return 'ประเภทงานวิจัย'
      case 'innovation': return 'ประเภทนวัตกรรม'
      case 'intellectual_property': return 'ประเภททรัพย์สินทางปัญญา'
      case 'award': return 'ระดับรางวัล'
      case 'utilization': return 'ประเภทการนำไปใช้'
      default: return 'ประเภทย่อย'
    }
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'research': return 'วิจัย'
      case 'innovation': return 'นวัตกรรม'
      case 'intellectual_property': return 'ทรัพย์สินทางปัญญา'
      case 'award': return 'รางวัล'
      case 'utilization': return 'การใช้ประโยชน์'
      default: return cat
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Tab Switcher - Light clinical theme */}
      <div className="flex bg-slate-100/70 p-1.5 rounded-xl border border-slate-200/80 max-w-4xl shadow-sm flex-wrap gap-1.5">
        <button
          onClick={() => setActiveSubTab('items')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'items' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          จัดการผลงาน
        </button>
        <button
          onClick={() => setActiveSubTab('lookups')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'lookups' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          จัดการตัวเลือกคัดกรอง
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'users' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          จัดการสิทธิ์ผู้ใช้งาน
        </button>
        <button
          onClick={() => setActiveSubTab('clinic')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'clinic' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          จัดการคลินิกวิจัย
        </button>
        <button
          onClick={() => setActiveSubTab('ethics')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'ethics' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clipboard className="w-4 h-4 shrink-0" />
          จัดการจริยธรรม
        </button>
        <button
          onClick={() => setActiveSubTab('ip')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'ip' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          จัดการคำขอ IP
        </button>
      </div>

      {/* SUBTAB 1: Items Management */}
      {activeSubTab === 'items' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-cyan-700 rounded-full"></span>
              คลังผลงานวิจัยทั้งหมดในระบบ
            </h3>
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              เพิ่มผลงานใหม่
            </button>
          </div>

          {itemsLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">กำลังโหลดผลงาน...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold border border-dashed border-slate-200 bg-white rounded-xl shadow-sm">
              ยังไม่มีข้อมูลในคลังผลงาน
            </div>
          ) : (
            <div className="light-card rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-4">หมวดหมู่</th>
                    <th className="p-4">ชื่อผลงาน</th>
                    <th className="p-4">ผู้จัดทำ</th>
                    <th className="p-4">การเผยแพร่</th>
                    <th className="p-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition">
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200/50">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800 truncate max-w-[240px]">
                        {item.title}
                      </td>
                      <td className="p-4 text-slate-500 font-medium truncate max-w-[150px]">{item.authors || '-'}</td>
                      <td className="p-4">
                        {item.is_public ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded text-[10px] font-bold">สาธารณะ</span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded text-[10px] font-bold">เฉพาะภายใน</span>
                        )}
                      </td>
                      <td className="p-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditForm(item)}
                          className="p-1.5 rounded bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition cursor-pointer shadow-sm"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 transition cursor-pointer shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Lookup Options Management */}
      {activeSubTab === 'lookups' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add form */}
          <div className="light-card rounded-xl p-5 border-slate-200 h-fit space-y-4 shadow-sm bg-white">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-cyan-700 rounded-full"></span>
              เพิ่มตัวเลือกตัวกรองใหม่
            </h3>
            <form onSubmit={handleAddLookup} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">หมวดหมู่ตัวกรอง (Category)</label>
                <select
                  value={lookupCategory}
                  onChange={(e) => setLookupCategory(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg light-input appearance-none cursor-pointer"
                >
                  <option value="research_type">ประเภทผลงานวิจัย/นวัตกรรม (research_type)</option>
                  <option value="department">สาขาวิชา/หน่วยงาน (department)</option>
                  <option value="ip_type">ประเภททรัพย์สินทางปัญญา (ip_type)</option>
                  <option value="award_level">ระดับรางวัลเชิดชูเกียรติ (award_level)</option>
                  <option value="utilization_type">ประเภทการนำไปใช้ประโยชน์ (utilization_type)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">ค่าหลังบ้าน (Value - เช่น R2R, Patent)</label>
                <input
                  type="text"
                  required
                  value={lookupValue}
                  onChange={(e) => setLookupValue(e.target.value)}
                  placeholder="เช่น R2R"
                  className="w-full py-2 px-3 rounded-lg light-input"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">ชื่อตัวเลือกภาษาไทย/อังกฤษ (Label)</label>
                <input
                  type="text"
                  required
                  value={lookupLabel}
                  onChange={(e) => setLookupLabel(e.target.value)}
                  placeholder="เช่น Routine to Research (R2R)"
                  className="w-full py-2 px-3 rounded-lg light-input"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">ลำดับการจัดเรียง (Sort Order)</label>
                <input
                  type="number"
                  value={lookupSortOrder}
                  onChange={(e) => setLookupSortOrder(Number(e.target.value))}
                  placeholder="0"
                  className="w-full py-2 px-3 rounded-lg light-input"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-sm"
              >
                บันทึกตัวเลือก
              </button>
            </form>
          </div>

          {/* List lookup options */}
          <div className="md:col-span-2 light-card rounded-xl p-5 border-slate-200 space-y-4 shadow-sm bg-white">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-cyan-700 rounded-full"></span>
              ตัวเลือกตัวกรองปัจจุบันทั้งหมด (Realtime)
            </h3>

            {options.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">ไม่มีตัวกรองเพิ่มเติมในระบบ</p>
            ) : (
              <div className="overflow-y-auto max-h-[500px] border border-slate-100 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3">หมวดหมู่</th>
                      <th className="p-3">ค่าระบบ (Value)</th>
                      <th className="p-3">ชื่อตัวเลือก (Label)</th>
                      <th className="p-3 text-center">จัดเรียง</th>
                      <th className="p-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {options.map((opt) => (
                      <tr key={opt.id} className="hover:bg-slate-50/40 transition">
                        <td className="p-3 text-slate-500 font-semibold">{opt.category}</td>
                        <td className="p-3 text-slate-700 font-mono text-[11px]">{opt.value}</td>
                        <td className="p-3 text-slate-800 font-bold">{opt.label}</td>
                        <td className="p-3 text-center text-slate-500">{opt.sort_order}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteLookup(opt.id)}
                            className="p-1 rounded bg-red-50 hover:bg-red-650 text-red-750 hover:text-white border border-red-150 transition cursor-pointer shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: Users & Roles Management */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-cyan-700 rounded-full"></span>
            รายชื่อผู้ใช้และสิทธิ์การเข้าใช้งาน
          </h3>

          {usersLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">กำลังโหลดข้อมูลผู้ใช้...</div>
          ) : (
            <div className="light-card rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-4">อีเมลผู้ใช้งาน (Email)</th>
                    <th className="p-4">ระดับสิทธิ์ (Role)</th>
                    <th className="p-4">วันที่ลงทะเบียน</th>
                    <th className="p-4 text-center">แก้ไขบทบาทหน้าที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-slate-50/40 transition">
                      <td className="p-4 font-bold text-slate-800">
                        {profile.email}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                          profile.role === 'admin' 
                            ? 'bg-red-50 text-red-700 border border-red-200/60' 
                            : profile.role === 'expert' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200/60' 
                            : 'bg-cyan-50 text-cyan-700 border border-cyan-200/60'
                        }`}>
                          {profile.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(profile.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleUpdateRole(profile.id, 'teacher')}
                            disabled={profile.role === 'teacher'}
                            className="px-2.5 py-1 rounded bg-cyan-50 hover:bg-cyan-700 text-cyan-700 hover:text-white border border-cyan-200/40 text-[9px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            TEACHER
                          </button>
                          <button
                            onClick={() => handleUpdateRole(profile.id, 'expert')}
                            disabled={profile.role === 'expert'}
                            className="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-700 text-purple-700 hover:text-white border border-purple-200/40 text-[9px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            EXPERT
                          </button>
                          <button
                            onClick={() => handleUpdateRole(profile.id, 'admin')}
                            disabled={profile.role === 'admin'}
                            className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-700 text-red-750 hover:text-white border border-red-200/40 text-[9px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            ADMIN
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: Clinic Management */}
      {activeSubTab === 'clinic' && (
        <div className="space-y-6 text-xs text-slate-700">
          {/* Description Section */}
          <div className="light-card rounded-xl p-5 border border-slate-200 bg-white space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-900 rounded-full"></span>
              คำอธิบายคลินิกวิจัย (สำหรับผู้ใช้งานทั่วไป)
            </h3>
            <textarea
              rows={3}
              value={clinicDesc}
              onChange={(e) => setClinicDesc(e.target.value)}
              className="w-full py-2 px-3 border border-slate-350 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 text-xs"
            />
            <div className="flex justify-end">
              <button
                onClick={handleUpdateClinicDesc}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg transition shadow-sm cursor-pointer"
              >
                บันทึกข้อมูลคลินิก
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Events Management */}
            <div className="light-card rounded-xl p-5 border border-slate-200 bg-white space-y-5 h-fit">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-blue-900 rounded-full"></span>
                  เพิ่มกิจกรรมสัมมนา / Workshop
                </h3>
                <form onSubmit={handleAddEvent} className="space-y-3 mt-3">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">หัวข้อกิจกรรม *</label>
                    <input
                      type="text"
                      required
                      value={newEvTitle}
                      onChange={(e) => setNewEvTitle(e.target.value)}
                      placeholder="เช่น การใช้สถิติเบื้องต้นในงานวิจัย"
                      className="w-full py-1.5 px-3 border border-slate-355 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">รายละเอียด</label>
                    <textarea
                      value={newEvDesc}
                      onChange={(e) => setNewEvDesc(e.target.value)}
                      placeholder="อธิบายกิจกรรมคร่าวๆ..."
                      className="w-full py-1.5 px-3 border border-slate-355 rounded-lg text-xs resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">วันเวลาจัดงาน *</label>
                      <input
                        type="datetime-local"
                        required
                        value={newEvDate}
                        onChange={(e) => setNewEvDate(e.target.value)}
                        className="w-full py-1.5 px-3 border border-slate-355 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">จำนวนที่รับ</label>
                      <input
                        type="number"
                        value={newEvCap}
                        onChange={(e) => setNewEvCap(e.target.value)}
                        placeholder="ไม่จำกัด"
                        className="w-full py-1.5 px-3 border border-slate-355 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">สถานที่จัดงาน</label>
                    <input
                      type="text"
                      value={newEvLoc}
                      onChange={(e) => setNewEvLoc(e.target.value)}
                      placeholder="เช่น ห้องประชุมอาคาร 3"
                      className="w-full py-1.5 px-3 border border-slate-355 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg transition text-xs cursor-pointer shadow"
                  >
                    บันทึกกิจกรรม
                  </button>
                </form>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-700 mb-3">รายการกิจกรรมปัจจุบัน</h4>
                {clinicEvents.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">ไม่มีรายการกิจกรรมในระบบ</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {clinicEvents.map((ev) => (
                      <div key={ev.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-start gap-2">
                        <div>
                          <h5 className="font-bold text-slate-800 leading-tight">{ev.title}</h5>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(ev.event_date).toLocaleString('th-TH')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-1 rounded bg-red-50 text-red-655 hover:bg-red-600 hover:text-white border border-red-200/50 transition cursor-pointer shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right/Middle: Appointments Management */}
            <div className="lg:col-span-2 light-card rounded-xl p-5 border border-slate-200 bg-white space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-900 rounded-full"></span>
                คำขอจองนัดหมายรับคำปรึกษาทั้งหมด
              </h3>

              {appointments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold border border-dashed border-slate-250 rounded-xl">
                  ยังไม่มีคำขอจองนัดหมายปรึกษา
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3">ผู้นัดหมาย</th>
                        <th className="p-3">หัวข้อ / วันเวลาเข้าพบ</th>
                        <th className="p-3">หมายเหตุ</th>
                        <th className="p-3 text-center">สถานะ</th>
                        <th className="p-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {appointments.map((app) => {
                        const requester = profiles.find(p => p.id === app.requester_id);
                        const isEditing = appEditing?.id === app.id;
                        
                        return (
                          <tr key={app.id} className="hover:bg-slate-50/40 transition">
                            <td className="p-3">
                              <div className="font-bold text-slate-800">{requester?.email || 'ไม่ระบุผู้ใช้'}</div>
                              <div className="text-[9px] text-slate-400 uppercase font-extrabold mt-0.5">Role: {requester?.role || 'teacher'}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-850">{app.topic}</div>
                              <div className="text-[10px] text-blue-900 font-bold mt-1">
                                🗓️ {new Date(app.requested_at).toLocaleString('th-TH')}
                              </div>
                            </td>
                            <td className="p-3 text-slate-500 max-w-[150px] truncate" title={app.notes}>
                              {app.notes || '-'}
                            </td>
                            <td className="p-3 text-center">
                              {isEditing ? (
                                <select
                                  value={appStatusInput}
                                  onChange={(e) => setAppStatusInput(e.target.value)}
                                  className="p-1.5 border border-slate-350 bg-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  <option value="pending">รอการยืนยัน</option>
                                  <option value="confirmed">ยืนยันแล้ว</option>
                                  <option value="cancelled">ยกเลิก</option>
                                  <option value="completed">เสร็จสิ้น</option>
                                </select>
                              ) : (
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250/50' :
                                  app.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-250/50' :
                                  app.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-250/50' :
                                  'bg-amber-50 text-amber-700 border border-amber-250/50'
                                }`}>
                                  {app.status === 'confirmed' ? 'CONFIRMED' :
                                   app.status === 'cancelled' ? 'CANCELLED' :
                                   app.status === 'completed' ? 'COMPLETED' : 'PENDING'}
                                </span>
                              )}
                              {app.admin_notes && !isEditing && (
                                <div className="text-[9px] text-slate-400 mt-1 italic">
                                  โน้ต: {app.admin_notes}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              {isEditing ? (
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    value={appNotesInput}
                                    onChange={(e) => setAppNotesInput(e.target.value)}
                                    placeholder="โน้ตตอบกลับ..."
                                    className="w-full p-1 border border-slate-300 rounded text-[11px]"
                                  />
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => handleUpdateAppStatus(app.id, appStatusInput, appNotesInput)}
                                      className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                    >
                                      บันทึก
                                    </button>
                                    <button
                                      onClick={() => setAppEditing(null)}
                                      className="px-2 py-0.5 bg-slate-400 text-white rounded text-[10px] font-bold cursor-pointer"
                                    >
                                      ปิด
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAppEditing(app)
                                    setAppStatusInput(app.status)
                                    setAppNotesInput(app.admin_notes || '')
                                  }}
                                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded text-[10px] font-bold cursor-pointer w-full text-center transition shadow-sm"
                                >
                                  แก้ไขสถานะ
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
          </div>
        </div>
      )}

      {/* SUBTAB 5: Ethics Management */}
      {activeSubTab === 'ethics' && (
        <div className="space-y-6 text-xs text-slate-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Downloadable Forms Manager */}
            <div className="light-card rounded-xl p-5 border border-slate-200 bg-white space-y-5 h-fit">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-blue-900 rounded-full"></span>
                  เพิ่มแบบฟอร์มดาวน์โหลดใหม่
                </h3>
                <form onSubmit={handleAddDownloadableForm} className="space-y-3 mt-3">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">ชื่อเอกสาร / แบบฟอร์ม *</label>
                    <input
                      type="text"
                      required
                      value={newFormTitle}
                      onChange={(e) => setNewFormTitle(e.target.value)}
                      placeholder="เช่น แบบฟอร์มขอจริยธรรม วิจัยในมนุษย์..."
                      className="w-full py-1.5 px-3 border border-slate-355 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">หมวดหมู่เอกสาร *</label>
                    <select
                      value={newFormCat}
                      onChange={(e) => setNewFormCat(e.target.value as 'ethics' | 'ip')}
                      className="w-full py-1.5 px-3 border border-slate-355 bg-white rounded-lg text-xs cursor-pointer"
                    >
                      <option value="ethics">จริยธรรมการวิจัย (Ethics)</option>
                      <option value="ip">ทรัพย์สินทางปัญญา (IP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">URL ไฟล์เอกสาร (จากเว็บหรือฝากไฟล์) *</label>
                    <input
                      type="url"
                      required
                      value={newFormUrl}
                      onChange={(e) => setNewFormUrl(e.target.value)}
                      placeholder="https://example.com/form.pdf"
                      className="w-full py-1.5 px-3 border border-slate-355 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg transition text-xs cursor-pointer shadow"
                  >
                    บันทึกแบบฟอร์ม
                  </button>
                </form>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-700 mb-3">แบบฟอร์มดาวน์โหลดปัจจุบัน</h4>
                {downloadableForms.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">ไม่มีแบบฟอร์มดาวน์โหลดในระบบ</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {downloadableForms.map((form) => (
                      <div key={form.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-800 leading-tight truncate">{form.title}</h5>
                          <span className="inline-block text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 mt-1">
                            {form.category}
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <a
                            href={form.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-blue-50 text-blue-650 hover:bg-blue-600 hover:text-white border border-blue-200/50 transition shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteDownloadableForm(form.id)}
                            className="p-1 rounded bg-red-50 text-red-655 hover:bg-red-600 hover:text-white border border-red-200/50 transition cursor-pointer shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right/Middle: Ethics Submissions List */}
            <div className="lg:col-span-2 light-card rounded-xl p-5 border border-slate-200 bg-white space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-900 rounded-full"></span>
                คำขอยื่นรับรองจริยธรรมการวิจัยทั้งหมด
              </h3>

              {ethicsSubmissions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold border border-dashed border-slate-250 rounded-xl">
                  ยังไม่มีคำขอยื่นรับรองจริยธรรม
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3">ผู้ยื่นคำขอ</th>
                        <th className="p-3">ข้อมูลโครงร่างวิจัย / เอกสารแนบ</th>
                        <th className="p-3">ผู้ทรงคุณวุฒิที่รีวิว (Reviewer)</th>
                        <th className="p-3 text-center">สถานะ</th>
                        <th className="p-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {ethicsSubmissions.map((sub) => {
                        const submitter = profiles.find(p => p.id === sub.submitter_id)
                        const reviewer = profiles.find(p => p.id === sub.assigned_reviewer_id)
                        const isEditing = subEditing?.id === sub.id
                        const subAttachList = attachments.filter(a => a.submission_id === sub.id)

                        return (
                          <tr key={sub.id} className="hover:bg-slate-50/40 transition">
                            <td className="p-3">
                              <div className="font-bold text-slate-800">{submitter?.email || 'ไม่ระบุผู้ใช้'}</div>
                              <p className="text-[10px] text-slate-400 mt-0.5">🗓️ ยื่นเมื่อ: {new Date(sub.created_at).toLocaleDateString('th-TH')}</p>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-850 leading-snug">{sub.project_title}</div>
                              {sub.project_description && <p className="text-[10px] text-slate-400 mt-1">{sub.project_description}</p>}
                              
                              {/* Attachments links */}
                              {subAttachList.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                  {subAttachList.map((at) => (
                                    <button
                                      key={at.id}
                                      onClick={() => handleDownloadPrivateFile(at.file_url)}
                                      className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-655 hover:text-slate-900 transition font-bold cursor-pointer"
                                      title={at.file_name}
                                    >
                                      <FileText className="w-3 h-3 text-blue-900" />
                                      {at.file_name || 'ไฟล์แนบ'}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              {isEditing ? (
                                <select
                                  value={subReviewerInput}
                                  onChange={(e) => setSubReviewerInput(e.target.value)}
                                  className="w-full p-1.5 border border-slate-355 bg-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  <option value="">-- ยังไม่มอบหมาย --</option>
                                  {profiles
                                    .filter((p) => p.role === 'expert' || p.role === 'admin')
                                    .map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.email} ({p.role.toUpperCase()})
                                      </option>
                                    ))}
                                </select>
                              ) : (
                                <div className="font-bold text-slate-700">
                                  {reviewer ? (
                                    <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                      {reviewer.email}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">ยังไม่มอบหมาย</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {isEditing ? (
                                <select
                                  value={subStatusInput}
                                  onChange={(e) => setSubStatusInput(e.target.value)}
                                  className="p-1.5 border border-slate-355 bg-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  <option value="ยื่นแล้ว">ยื่นแล้ว</option>
                                  <option value="กำลังตรวจ">กำลังตรวจ</option>
                                  <option value="รอแก้ไข">รอแก้ไข</option>
                                  <option value="อนุมัติ">อนุมัติ</option>
                                  <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
                                </select>
                              ) : (
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  sub.status === 'อนุมัติ' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250/50' :
                                  sub.status === 'ไม่อนุมัติ' ? 'bg-red-50 text-red-700 border border-red-250/50' :
                                  sub.status === 'รอแก้ไข' ? 'bg-amber-50 text-amber-700 border border-amber-250/50' :
                                  sub.status === 'กำลังตรวจ' ? 'bg-purple-50 text-purple-750 border border-purple-250/50' :
                                  'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {sub.status}
                                </span>
                              )}
                              {sub.reviewer_notes && !isEditing && (
                                <div className="text-[9px] text-slate-400 mt-1 italic max-w-[150px] truncate" title={sub.reviewer_notes}>
                                  โน้ต: {sub.reviewer_notes}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              {isEditing ? (
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    value={subNotesInput}
                                    onChange={(e) => setSubNotesInput(e.target.value)}
                                    placeholder="ความเห็นผู้ตรวจ..."
                                    className="w-full p-1 border border-slate-300 rounded text-[11px]"
                                  />
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => handleUpdateSubmission(sub.id, subReviewerInput || null, subStatusInput, subNotesInput)}
                                      className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                    >
                                      บันทึก
                                    </button>
                                    <button
                                      onClick={() => setSubEditing(null)}
                                      className="px-2 py-0.5 bg-slate-400 text-white rounded text-[10px] font-bold cursor-pointer"
                                    >
                                      ปิด
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSubEditing(sub)
                                    setSubReviewerInput(sub.assigned_reviewer_id || '')
                                    setSubStatusInput(sub.status)
                                    setSubNotesInput(sub.reviewer_notes || '')
                                  }}
                                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded text-[10px] font-bold cursor-pointer w-full text-center transition shadow-sm"
                                >
                                  แก้ไข/มอบหมาย
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
          </div>
        </div>
      )}

      {/* SUBTAB 6: Intellectual Property (IP) Applications */}
      {activeSubTab === 'ip' && (
        <div className="space-y-4 text-xs text-slate-700">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-cyan-700 rounded-full"></span>
            รายการยื่นขอขึ้นทะเบียนทรัพย์สินทางปัญญาทั้งหมด
          </h3>

          {ipApplications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-semibold border border-dashed border-slate-250 rounded-xl">
              ยังไม่มีคำขอยื่นขึ้นทะเบียนทรัพย์สินทางปัญญา
            </div>
          ) : (
            <div className="light-card rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3.5">ผู้ยื่นคำขอ</th>
                    <th className="p-3.5">ชื่อผลงาน / ประเภททรัพย์สิน</th>
                    <th className="p-3.5">เลขที่คำขอ (กรมทรัพย์สินฯ)</th>
                    <th className="p-3.5">ขั้นตอนปัจจุบัน / โน้ตเพิ่มเติม</th>
                    <th className="p-3.5 text-center">สถานะ</th>
                    <th className="p-3.5 text-center">จัดการและอัปเดต</th>
                    <th className="p-3.5 text-center">คลังหลัก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ipApplications.map((app) => {
                    const applicant = profiles.find(p => p.id === app.applicant_id)
                    const isEditing = ipEditing?.id === app.id

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/40 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{applicant?.email || 'ไม่ระบุผู้ใช้'}</div>
                          <p className="text-[9px] text-slate-400 mt-0.5">🗓️ วันที่ยื่น: {new Date(app.created_at).toLocaleDateString('th-TH')}</p>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-850">{app.title}</div>
                          <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200/50 mt-1">
                            {app.ip_type}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">
                          {isEditing ? (
                            <input
                              type="text"
                              value={ipReqNumInput}
                              onChange={(e) => setIpReqNumInput(e.target.value)}
                              placeholder="เช่น 2003001234"
                              className="p-1 border border-slate-300 rounded text-xs w-full font-bold"
                            />
                          ) : (
                            app.request_number || <span className="text-slate-400 italic font-medium">ไม่มีเลขที่คำขอ</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={ipStepInput}
                                onChange={(e) => setIpStepInput(e.target.value)}
                                placeholder="เช่น ตรวจสอบความถูกต้อง"
                                className="p-1 border border-slate-300 rounded text-xs w-full"
                              />
                              <input
                                type="text"
                                value={ipNotesInput}
                                onChange={(e) => setIpNotesInput(e.target.value)}
                                placeholder="โน้ตเพิ่มเติม..."
                                className="p-1 border border-slate-300 rounded text-xs w-full"
                              />
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              {app.current_step && (
                                <div className="font-bold text-slate-700">
                                  👉 {app.current_step}
                                </div>
                              )}
                              {app.admin_notes && (
                                <div className="text-[10px] text-slate-450 italic">
                                  โน้ต: {app.admin_notes}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {isEditing ? (
                            <select
                              value={ipStatusInput}
                              onChange={(e) => setIpStatusInput(e.target.value)}
                              className="p-1 border border-slate-300 rounded text-xs bg-white cursor-pointer font-bold"
                            >
                              <option value="ยื่นคำขอ">ยื่นคำขอ</option>
                                      <option value="กำลังตรวจสอบ">กำลังตรวจสอบ</option>
                              <option value="รอเอกสารเพิ่ม">รอเอกสารเพิ่ม</option>
                              <option value="อนุมัติ">อนุมัติ</option>
                              <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
                            </select>
                          ) : (
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              app.status === 'อนุมัติ' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250/50' :
                              app.status === 'ไม่อนุมัติ' ? 'bg-red-50 text-red-700 border border-red-250/50' :
                              app.status === 'รอเอกสารเพิ่ม' ? 'bg-amber-50 text-amber-700 border border-amber-250/50' :
                              app.status === 'กำลังตรวจสอบ' ? 'bg-purple-50 text-purple-700 border border-purple-250/50' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {app.status}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isEditing ? (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => handleUpdateIPApp(app.id, ipStatusInput, ipStepInput, ipNotesInput, ipReqNumInput)}
                                className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                บันทึก
                              </button>
                              <button
                                onClick={() => setIpEditing(null)}
                                className="px-2 py-0.5 bg-slate-400 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                ปิด
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setIpEditing(app)
                                setIpReqNumInput(app.request_number || '')
                                setIpStepInput(app.current_step || '')
                                setIpNotesInput(app.admin_notes || '')
                                setIpStatusInput(app.status)
                              }}
                              className="px-2.5 py-1 bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded text-[10px] font-bold cursor-pointer w-full text-center transition shadow-sm"
                            >
                              แก้ไขคำขอ
                            </button>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {app.transferred_to_catalog ? (
                            <span className="text-[10px] text-slate-450 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">โอนย้ายแล้ว</span>
                          ) : (
                            <button
                              onClick={() => handleTransferToCatalog(app)}
                              className="px-2 py-1 bg-gradient-to-r from-blue-900 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 text-white rounded text-[10px] font-bold transition shadow-sm cursor-pointer"
                            >
                              โอนเข้าคลัง
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

      {/* Item Add/Edit modal form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'แก้ไขข้อมูลผลงานวิจัย / คลังปัญญา' : 'เพิ่มผลงานวิจัย / คลังปัญญาใหม่'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleItemSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">เลือกหมวดหมู่คลังผลงาน (Category)</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as WisdomItem['category'])}
                    className="w-full py-2 px-3 rounded-lg light-input appearance-none cursor-pointer"
                  >
                    <option value="research">คลังวิจัย</option>
                    <option value="innovation">คลังนวัตกรรม</option>
                    <option value="intellectual_property">คลังทรัพย์สินทางปัญญา</option>
                    <option value="award">คลังรางวัลเชิดชูเกียรติ</option>
                    <option value="utilization">คลังการนำไปใช้ประโยชน์</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">หน่วยงาน / สาขาวิชา</label>
                  <select
                    value={metaDept}
                    onChange={(e) => setMetaDept(e.target.value)}
                    required
                    className="w-full py-2 px-3 rounded-lg light-input appearance-none cursor-pointer"
                  >
                    <option value="">เลือกหน่วยงาน...</option>
                    {getOptionsByCategory('department').map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">ชื่อผลงาน (Title)</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="กรอกหัวข้อผลงานวิจัย / รางวัล / นวัตกรรม"
                  className="w-full py-2 px-3 rounded-lg light-input"
                />
              </div>

              {/* Authors & Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-500 font-bold mb-1">คณะผู้จัดทำ (Authors - คั่นด้วยเครื่องหมายจุลภาค `,` )</label>
                  <input
                    type="text"
                    required
                    value={formAuthors}
                    onChange={(e) => setFormAuthors(e.target.value)}
                    placeholder="เช่น ดร.สมศักดิ์ รักเรียน, ผศ.ดร.กานดา โพธิ์ดี"
                    className="w-full py-2 px-3 rounded-lg light-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">ปีงบประมาณ / ปีที่จัดทำ</label>
                  <input
                    type="text"
                    value={metaYear}
                    onChange={(e) => setMetaYear(e.target.value)}
                    placeholder="เช่น 2569"
                    className="w-full py-2 px-3 rounded-lg light-input"
                  />
                </div>
              </div>

              {/* Category-Specific fields */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="text-[10px] font-bold text-cyan-800 uppercase tracking-widest border-b border-slate-200 pb-1.5">
                  ข้อมูลเพิ่มเติมระบุเฉพาะกลุ่ม ({getCategoryLabel(formCategory)})
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Type */}
                  {getSubtypeCategoryForForm() && (
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">{getSubtypeLabelForForm()}</label>
                      <select
                        value={metaSubtype}
                        onChange={(e) => setMetaSubtype(e.target.value)}
                        required
                        className="w-full py-2 px-3 rounded-lg light-input appearance-none cursor-pointer"
                      >
                        <option value="">เลือก{getSubtypeLabelForForm()}...</option>
                        {getOptionsByCategory(getSubtypeCategoryForForm()).map((opt) => (
                          <option key={opt.id} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Research specific */}
                  {formCategory === 'research' && (
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">ตีพิมพ์เผยแพร่ในวารสาร (ถ้ามี)</label>
                      <input
                        type="text"
                        value={metaJournal}
                        onChange={(e) => setMetaJournal(e.target.value)}
                        placeholder="เช่น วารสารพยาบาลศาสตร์"
                        className="w-full py-2 px-3 rounded-lg light-input"
                      />
                    </div>
                  )}

                  {/* IP specific */}
                  {formCategory === 'intellectual_property' && (
                    <>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">เลขทะเบียนจดสิทธิบัตร/อนุสิทธิบัตร</label>
                        <input
                          type="text"
                          value={metaRegNum}
                          onChange={(e) => setMetaRegNum(e.target.value)}
                          placeholder="เช่น 2003001234"
                          className="w-full py-2 px-3 rounded-lg light-input"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">วันที่อนุมัติ / ขึ้นทะเบียนสิทธิ์</label>
                        <input
                          type="text"
                          value={metaRegDate}
                          onChange={(e) => setMetaRegDate(e.target.value)}
                          placeholder="เช่น 12 กรกฎาคม 2569"
                          className="w-full py-2 px-3 rounded-lg light-input"
                        />
                      </div>
                    </>
                  )}

                  {/* Award specific */}
                  {formCategory === 'award' && (
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">หน่วยงานต้นสังกัดที่มอบรางวัล</label>
                      <input
                        type="text"
                        value={metaOrganizer}
                        onChange={(e) => setMetaOrganizer(e.target.value)}
                        placeholder="เช่น สมาคมพยาบาลแห่งประเทศไทย"
                        className="w-full py-2 px-3 rounded-lg light-input"
                      />
                    </div>
                  )}

                  {/* Utilization specific */}
                  {formCategory === 'utilization' && (
                    <>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">หน่วยงานหรือชุมชนที่อ้างอิงนำไปใช้</label>
                        <input
                          type="text"
                          value={metaOrgUsed}
                          onChange={(e) => setMetaOrgUsed(e.target.value)}
                          placeholder="เช่น ชุมชนตำบลเกิ้ง อ.เมือง มหาสารคาม"
                          className="w-full py-2 px-3 rounded-lg light-input"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-slate-500 font-bold mb-1">ประโยชน์เชิงประจักษ์ / ผลลัพธ์เชิงบวก</label>
                        <textarea
                          rows={2}
                          value={metaImpact}
                          onChange={(e) => setMetaImpact(e.target.value)}
                          placeholder="เขียนอธิบายประโยชน์เชิงโครงสร้างหรือการปฏิบัติจริง..."
                          className="w-full py-2 px-3 rounded-lg light-input resize-none text-[11px]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">บทคัดย่อ / รายละเอียดของผลงาน (Description / Abstract)</label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม บทคัดย่อ หรือข้อมูลอธิบาย..."
                  className="w-full py-2 px-3 rounded-lg light-input resize-none text-xs"
                />
              </div>

              {/* File uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image upload */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    ภาพประกอบหลัก ({editingItem?.image_url ? 'มีภาพเดิมแล้ว ต้องการเปลี่ยนเลือกไฟล์ใหม่' : 'เลือกอัปโหลดไฟล์ภาพ'})
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full py-1.5 px-3 rounded-lg light-input text-[10px]"
                  />
                </div>

                {/* Doc file upload */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    เอกสารแนบ PDF/Word ({editingItem?.file_url ? 'มีไฟล์เอกสารแนบแล้ว อัปใหม่เพื่อทับไฟล์เดิม' : 'เลือกอัปโหลดเอกสารแนบ'})
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full py-1.5 px-3 rounded-lg light-input text-[10px]"
                  />
                </div>
              </div>

              {/* Public/Private Toggle */}
              <div className="flex items-center gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <input
                  type="checkbox"
                  id="formIsPublic"
                  checked={formIsPublic}
                  onChange={(e) => setFormIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-700 border-slate-300 bg-white cursor-pointer"
                />
                <div>
                  <label htmlFor="formIsPublic" className="block text-slate-900 font-bold cursor-pointer select-none">
                    เผยแพร่เป็นผลงานสาธารณะ (Publicly Visible)
                  </label>
                  <span className="text-[10px] text-slate-500">
                    หากเว้นว่าง จะจำกัดสิทธิ์การดูข้อมูลเฉพาะบุคลากรภายในวิทยาลัยที่เข้าสู่ระบบเท่านั้น
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 font-bold transition shadow-sm cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {submitLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
