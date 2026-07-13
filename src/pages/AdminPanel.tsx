import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useLookups } from '../context/LookupContext'
import { Settings, Users, BookOpen, Calendar, Award, Clipboard, LayoutGrid } from 'lucide-react'
import { WisdomItem } from './Dashboard'
import { Profile } from '../context/AuthContext'
import { PageHeader, ContentPanel, PageHeaderTab } from '../components/PageHeader'
import { OverviewTab } from './admin/OverviewTab'
import { ItemsTab } from './admin/ItemsTab'
import { ItemFormModal } from './admin/ItemFormModal'
import { LookupsTab } from './admin/LookupsTab'
import { UsersTab } from './admin/UsersTab'
import { ClinicTab } from './admin/ClinicTab'
import { EthicsTab } from './admin/EthicsTab'
import { IpTab } from './admin/IpTab'

export const AdminPanel: React.FC = () => {
  const { options, getOptionsByCategory, refreshOptions } = useLookups()
  const location = useLocation()

  const [itemSearch, setItemSearch] = useState('')

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

  // Fetch everything eagerly (not just the active section) so the left-nav
  // badges and the Overview desk always reflect live counts, not stale zeros
  // from a section that hasn't been visited yet.
  useEffect(() => {
    fetchItems()
    fetchProfiles()
    fetchAppointments()
    fetchClinicEvents()
    fetchClinicDesc()
    fetchEthicsSubmissions()
    fetchDownloadableForms()
    fetchAttachments()
    fetchIpApplications()

    const channels = [
      supabase.channel('admin-items-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'wisdom_items' }, () => fetchItems()).subscribe(),
      supabase.channel('admin-profiles-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchProfiles()).subscribe(),
      supabase.channel('admin-app-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchAppointments()).subscribe(),
      supabase.channel('admin-ev-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_events' }, () => fetchClinicEvents()).subscribe(),
      supabase.channel('admin-ethics-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_submissions' }, () => fetchEthicsSubmissions()).subscribe(),
      supabase.channel('admin-forms-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'downloadable_forms' }, () => fetchDownloadableForms()).subscribe(),
      supabase.channel('admin-attach-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'ethics_attachments' }, () => fetchAttachments()).subscribe(),
      supabase.channel('admin-ip-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'ip_applications' }, () => fetchIpApplications()).subscribe(),
    ]

    return () => {
      channels.forEach((c) => supabase.removeChannel(c))
    }
  }, [])

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

  // "Needs attention" = the item has just arrived and nobody has acted on it yet —
  // the honest definition of an inbox, not just "anything with an amber badge".
  const pendingAppointments = appointments.filter((a: any) => a.status === 'pending')
  const pendingEthicsSubs = ethicsSubmissions.filter((s: any) => s.status === 'ยื่นแล้ว')
  const pendingIpApps = ipApplications.filter((a: any) => a.status === 'ยื่นคำขอ')

  const deskItems = [
    ...pendingAppointments.map((a: any) => ({
      id: `appt-${a.id}`,
      icon: Calendar,
      kind: 'นัดหมายรอยืนยัน',
      title: a.topic,
      who: profiles.find((p) => p.id === a.requester_id)?.email || 'ไม่ระบุผู้ใช้',
      createdAt: a.created_at,
      to: '/admin/clinic',
    })),
    ...pendingEthicsSubs.map((s: any) => ({
      id: `eth-${s.id}`,
      icon: Clipboard,
      kind: 'จริยธรรมรอมอบหมาย',
      title: s.project_title,
      who: profiles.find((p) => p.id === s.submitter_id)?.email || 'ไม่ระบุผู้ใช้',
      createdAt: s.created_at,
      to: '/admin/ethics',
    })),
    ...pendingIpApps.map((a: any) => ({
      id: `ip-${a.id}`,
      icon: Award,
      kind: 'คำขอ IP รอดำเนินการ',
      title: a.title,
      who: profiles.find((p) => p.id === a.applicant_id)?.email || 'ไม่ระบุผู้ใช้',
      createdAt: a.created_at,
      to: '/admin/ip',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Same flat tab-pill pattern as Clinic/Ethics/IP Application — grouped into
  // clusters (overview | content | people | services) with hairline dividers,
  // since Admin's sections are really that: one console with a few families of
  // task, not a separate app with its own nav language.
  const activeAdminTab = location.pathname === '/admin' ? 'overview' : location.pathname.split('/')[2] || 'overview'

  const adminTabs: PageHeaderTab[] = [
    { key: 'overview', icon: <LayoutGrid className="w-4 h-4" />, label: 'โต๊ะทำงานวันนี้', badge: deskItems.length, to: '/admin' },
    { key: 'div-1', divider: true },
    { key: 'items', icon: <BookOpen className="w-4 h-4" />, label: 'จัดการผลงาน', to: '/admin/items' },
    { key: 'lookups', icon: <Settings className="w-4 h-4" />, label: 'ตัวเลือกคัดกรอง', to: '/admin/lookups' },
    { key: 'div-2', divider: true },
    { key: 'users', icon: <Users className="w-4 h-4" />, label: 'ผู้ใช้งานและสิทธิ์', to: '/admin/users' },
    { key: 'div-3', divider: true },
    { key: 'clinic', icon: <Calendar className="w-4 h-4" />, label: 'คลินิกวิจัย', badge: pendingAppointments.length, to: '/admin/clinic' },
    { key: 'ethics', icon: <Clipboard className="w-4 h-4" />, label: 'จริยธรรมการวิจัย', badge: pendingEthicsSubs.length, to: '/admin/ethics' },
    { key: 'ip', icon: <Award className="w-4 h-4" />, label: 'ทรัพย์สินทางปัญญา', badge: pendingIpApps.length, to: '/admin/ip' },
  ]

  const filteredItems = itemSearch.trim()
    ? items.filter((item) =>
        item.title.toLowerCase().includes(itemSearch.trim().toLowerCase()) ||
        (item.authors || '').toLowerCase().includes(itemSearch.trim().toLowerCase())
      )
    : items

  return (
    <div className="flex-1 animate-fadeIn text-slate-800">
      <PageHeader
        title="ระบบหลังบ้าน"
        subtitle="Admin Console — จัดการเนื้อหา ผู้ใช้งาน และคำขอทั้งหมดของระบบ"
        extraBadge="Admin Only"
        recordCode="ADM-00"
        tabs={adminTabs}
        activeTab={activeAdminTab}
      />

      <ContentPanel>
        <Routes>
          <Route
            index
            element={(
              <OverviewTab
                pendingAppointmentsCount={pendingAppointments.length}
                pendingEthicsCount={pendingEthicsSubs.length}
                pendingIpCount={pendingIpApps.length}
                deskItems={deskItems}
              />
            )}
          />
          <Route
            path="items"
            element={(
              <ItemsTab
                items={items}
                filteredItems={filteredItems}
                itemsLoading={itemsLoading}
                itemSearch={itemSearch}
                setItemSearch={setItemSearch}
                getCategoryLabel={getCategoryLabel}
                onOpenAddForm={handleOpenAddForm}
                onOpenEditForm={handleOpenEditForm}
                onDeleteItem={handleDeleteItem}
              />
            )}
          />
          <Route
            path="lookups"
            element={(
              <LookupsTab
                options={options}
                lookupCategory={lookupCategory}
                setLookupCategory={setLookupCategory}
                lookupValue={lookupValue}
                setLookupValue={setLookupValue}
                lookupLabel={lookupLabel}
                setLookupLabel={setLookupLabel}
                lookupSortOrder={lookupSortOrder}
                setLookupSortOrder={setLookupSortOrder}
                onAddLookup={handleAddLookup}
                onDeleteLookup={handleDeleteLookup}
              />
            )}
          />
          <Route
            path="users"
            element={<UsersTab profiles={profiles} usersLoading={usersLoading} onUpdateRole={handleUpdateRole} />}
          />
          <Route
            path="clinic"
            element={(
              <ClinicTab
                clinicDesc={clinicDesc}
                setClinicDesc={setClinicDesc}
                onUpdateClinicDesc={handleUpdateClinicDesc}
                newEvTitle={newEvTitle}
                setNewEvTitle={setNewEvTitle}
                newEvDesc={newEvDesc}
                setNewEvDesc={setNewEvDesc}
                newEvDate={newEvDate}
                setNewEvDate={setNewEvDate}
                newEvLoc={newEvLoc}
                setNewEvLoc={setNewEvLoc}
                newEvCap={newEvCap}
                setNewEvCap={setNewEvCap}
                onAddEvent={handleAddEvent}
                clinicEvents={clinicEvents}
                onDeleteEvent={handleDeleteEvent}
                appointments={appointments}
                profiles={profiles}
                appEditing={appEditing}
                setAppEditing={setAppEditing}
                appStatusInput={appStatusInput}
                setAppStatusInput={setAppStatusInput}
                appNotesInput={appNotesInput}
                setAppNotesInput={setAppNotesInput}
                onUpdateAppStatus={handleUpdateAppStatus}
              />
            )}
          />
          <Route
            path="ethics"
            element={(
              <EthicsTab
                newFormTitle={newFormTitle}
                setNewFormTitle={setNewFormTitle}
                newFormCat={newFormCat}
                setNewFormCat={setNewFormCat}
                newFormUrl={newFormUrl}
                setNewFormUrl={setNewFormUrl}
                onAddDownloadableForm={handleAddDownloadableForm}
                downloadableForms={downloadableForms}
                onDeleteDownloadableForm={handleDeleteDownloadableForm}
                ethicsSubmissions={ethicsSubmissions}
                profiles={profiles}
                attachments={attachments}
                onDownloadPrivateFile={handleDownloadPrivateFile}
                subEditing={subEditing}
                setSubEditing={setSubEditing}
                subReviewerInput={subReviewerInput}
                setSubReviewerInput={setSubReviewerInput}
                subStatusInput={subStatusInput}
                setSubStatusInput={setSubStatusInput}
                subNotesInput={subNotesInput}
                setSubNotesInput={setSubNotesInput}
                onUpdateSubmission={handleUpdateSubmission}
              />
            )}
          />
          <Route
            path="ip"
            element={(
              <IpTab
                ipApplications={ipApplications}
                profiles={profiles}
                ipEditing={ipEditing}
                setIpEditing={setIpEditing}
                ipReqNumInput={ipReqNumInput}
                setIpReqNumInput={setIpReqNumInput}
                ipStepInput={ipStepInput}
                setIpStepInput={setIpStepInput}
                ipNotesInput={ipNotesInput}
                setIpNotesInput={setIpNotesInput}
                ipStatusInput={ipStatusInput}
                setIpStatusInput={setIpStatusInput}
                onUpdateIPApp={handleUpdateIPApp}
                onTransferToCatalog={handleTransferToCatalog}
                newFormTitle={newFormTitle}
                setNewFormTitle={setNewFormTitle}
                newFormCat={newFormCat}
                setNewFormCat={setNewFormCat}
                newFormUrl={newFormUrl}
                setNewFormUrl={setNewFormUrl}
                onAddDownloadableForm={handleAddDownloadableForm}
                downloadableForms={downloadableForms}
                onDeleteDownloadableForm={handleDeleteDownloadableForm}
              />
            )}
          />
        </Routes>
      </ContentPanel>

      <ItemFormModal
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        editingItem={editingItem}
        submitLoading={submitLoading}
        onSubmit={handleItemSubmit}
        getOptionsByCategory={getOptionsByCategory}
        getCategoryLabel={getCategoryLabel}
        getSubtypeCategoryForForm={getSubtypeCategoryForForm}
        getSubtypeLabelForForm={getSubtypeLabelForForm}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formTitle={formTitle}
        setFormTitle={setFormTitle}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formAuthors={formAuthors}
        setFormAuthors={setFormAuthors}
        formIsPublic={formIsPublic}
        setFormIsPublic={setFormIsPublic}
        setImageFile={setImageFile}
        setDocFile={setDocFile}
        metaDept={metaDept}
        setMetaDept={setMetaDept}
        metaSubtype={metaSubtype}
        setMetaSubtype={setMetaSubtype}
        metaYear={metaYear}
        setMetaYear={setMetaYear}
        metaJournal={metaJournal}
        setMetaJournal={setMetaJournal}
        metaRegNum={metaRegNum}
        setMetaRegNum={setMetaRegNum}
        metaRegDate={metaRegDate}
        setMetaRegDate={setMetaRegDate}
        metaOrganizer={metaOrganizer}
        setMetaOrganizer={setMetaOrganizer}
        metaOrgUsed={metaOrgUsed}
        setMetaOrgUsed={setMetaOrgUsed}
        metaImpact={metaImpact}
        setMetaImpact={setMetaImpact}
      />
    </div>
  )
}

