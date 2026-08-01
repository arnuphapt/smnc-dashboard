'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createClient as createAnonClient } from '@supabase/supabase-js'

const supabase = createClient()
import { useMasters } from '@/context/MasterContext'
import { getTableForCategory } from '@/utils/masterTables'
import { Calendar, Award, Clipboard } from 'lucide-react'
import { WisdomItem } from './Dashboard'
import { Profile } from '@/context/AuthContext'
import { PageHeader, ContentPanel } from '@/components/PageHeader'
import { OverviewTab } from './masterdata/OverviewTab'
import { ItemsTab } from './masterdata/ItemsTab'
import { ItemFormModal } from './masterdata/ItemFormModal'
import { MastersTab } from './masterdata/MastersTab'
import { UsersTab } from './masterdata/UsersTab'
import { ClinicTab } from './masterdata/ClinicTab'
import { EthicsTab } from './masterdata/EthicsTab'
import { IpTab } from './masterdata/IpTab'
import { RolesTab } from './masterdata/RolesTab'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export const MasterdataPanel: React.FC = () => {
  const { options, getOptionsByCategory, refreshOptions } = useMasters()
  const pathname = usePathname()

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
  const [newFormCat, setNewFormCat] = useState<'ethics' | 'ip' | 'utilization'>('ethics')
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
  const [metaScope, setMetaScope] = useState('')
  const [metaJournalRank, setMetaJournalRank] = useState('')
  const [metaContribution, setMetaContribution] = useState('')
  const [metaFundingHas, setMetaFundingHas] = useState('')
  const [metaFundingDetail, setMetaFundingDetail] = useState('')
  const [metaSource, setMetaSource] = useState('')
  const [metaIpStatus, setMetaIpStatus] = useState('')
  const [metaApplicationStatus, setMetaApplicationStatus] = useState('')
  const [metaIpCurrentStatus, setMetaIpCurrentStatus] = useState('')
  const [metaPatentNum, setMetaPatentNum] = useState('')
  const [metaCreatorType, setMetaCreatorType] = useState('')
  const [metaAwardName, setMetaAwardName] = useState('')
  const [metaUtilizationDate, setMetaUtilizationDate] = useState('')

  // Lookups Form State
  const [lookupCategory, setLookupCategory] = useState('research_type')
  const [lookupValue, setLookupValue] = useState('')

  // Dynamic Confirm Dialog States
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string
    description: string
    confirmLabel?: string
    variant?: 'danger' | 'primary' | 'warning'
    alertOnly?: boolean
    onConfirm: () => Promise<void>
  } | null>(null)

  const triggerConfirm = (config: {
    title: string
    description: string
    confirmLabel?: string
    variant?: 'danger' | 'primary' | 'warning'
    alertOnly?: boolean
    onConfirm: () => Promise<void>
  }) => {
    setConfirmConfig(config)
    setConfirmOpen(true)
  }

  const triggerAlert = (title: string, description: string, variant: 'primary' | 'danger' | 'warning' = 'primary') => {
    triggerConfirm({
      title,
      description,
      confirmLabel: 'ตกลง',
      alertOnly: true,
      variant,
      onConfirm: async () => {}
    })
  }

  const handleConfirmAction = async () => {
    if (!confirmConfig) return
    setConfirmLoading(true)
    try {
      await confirmConfig.onConfirm()
      setConfirmLoading(false)
      setConfirmOpen(false)
      setConfirmConfig(null)
    } catch (err: any) {
      setConfirmLoading(false)
      triggerAlert('เกิดข้อผิดพลาด', err.message, 'danger')
    }
  }

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

  const handleOpenAddForm = (defaultCategory?: WisdomItem['category']) => {
    setEditingItem(null)
    setFormCategory(defaultCategory || 'research')
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
    setMetaScope('')
    setMetaJournalRank('')
    setMetaContribution('')
    setMetaFundingHas('')
    setMetaFundingDetail('')
    setMetaSource('')
    setMetaIpStatus('')
    setMetaApplicationStatus('')
    setMetaIpCurrentStatus('')
    setMetaPatentNum('')
    setMetaAwardName('')
    setMetaUtilizationDate('')

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
      (item.category === 'innovation' ? item.metadata.innovation_type : item.metadata.research_type) ||
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
    setMetaScope(item.metadata.scope || '')
    setMetaJournalRank(item.metadata.journal_rank || '')
    setMetaContribution(item.metadata.contribution || '')
    if (item.metadata.funding && item.metadata.funding !== 'ไม่มี') {
      setMetaFundingHas('มี')
      const detail = String(item.metadata.funding).replace(/^มี\s*-\s*/, '')
      setMetaFundingDetail(detail === 'มี' ? '' : detail)
    } else {
      setMetaFundingHas(item.metadata.funding ? 'ไม่มี' : '')
      setMetaFundingDetail('')
    }
    setMetaSource(item.metadata.source || '')
    setMetaIpStatus(item.metadata.ip_status || '')
    setMetaApplicationStatus(item.metadata.application_status || '')
    setMetaIpCurrentStatus(item.metadata.status || '')
    setMetaPatentNum(item.metadata.patent_number || '')
    setMetaCreatorType(item.metadata.creator_type || '')
    setMetaAwardName(item.metadata.award_name || '')
    setMetaUtilizationDate(item.metadata.utilization_date || '')

    setIsFormOpen(true)
  }

  const uploadFile = async (file: File, folder: string, isPublic: boolean): Promise<string> => {
    const bucket = folder === 'images' ? 'wisdom-public' : (isPublic ? 'wisdom-public' : 'wisdom-private')
    const extIndex = file.name.lastIndexOf('.')
    const ext = extIndex !== -1 ? file.name.substring(extIndex) : ''
    const base = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name
    const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, '_')
    const safeName = /[a-zA-Z0-9]/.test(sanitizedBase) ? sanitizedBase : 'file'
    const fileName = `${folder}/${Date.now()}_${safeName}${ext}`

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
        metadata.journal_rank = metaJournalRank
        metadata.scope = metaScope
        metadata.contribution = metaContribution
        metadata.funding = metaFundingHas === 'มี'
          ? (metaFundingDetail.trim() ? `มี - ${metaFundingDetail.trim()}` : 'มี')
          : 'ไม่มี'
      } else if (formCategory === 'innovation') {
        metadata.innovation_type = metaSubtype
        metadata.scope = metaScope
        metadata.source = metaSource
        metadata.ip_status = metaIpStatus
        metadata.award_name = metaAwardName
      } else if (formCategory === 'intellectual_property') {
        metadata.ip_type = metaSubtype
        metadata.registration_number = metaRegNum
        metadata.registration_date = metaRegDate
        metadata.scope = metaScope
        metadata.source = metaSource
        metadata.application_status = metaApplicationStatus
        metadata.status = metaIpCurrentStatus
        metadata.patent_number = metaPatentNum
        metadata.creator_type = metaCreatorType
      } else if (formCategory === 'award') {
        metadata.award_level = metaSubtype
        metadata.organizer = metaOrganizer
        metadata.scope = metaScope
        metadata.award_name = metaAwardName
      } else if (formCategory === 'utilization') {
        metadata.utilization_type = metaSubtype
        metadata.organization_used = metaOrgUsed
        metadata.impact_summary = metaImpact
        metadata.utilization_date = metaUtilizationDate
      }

      const rowData = {
        category: formCategory,
        title: formTitle,
        description: formDescription || '-',
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
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถบันทึกข้อมูลได้: ${err.message}`, 'danger')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteItem = (id: string) => {
    triggerConfirm({
      title: 'ลบผลงานวิจัย?',
      description: 'คุณแน่ใจหรือไม่ว่าต้องการลบผลงานนี้ออกจากระบบอย่างถาวร?',
      confirmLabel: 'ลบผลงาน',
      variant: 'danger',
      onConfirm: async () => {
        const { error } = await supabase
          .from('wisdom_items')
          .delete()
          .eq('id', id)
        if (error) throw error
        fetchItems()
      }
    })
  }

  const handleAddLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookupValue) return
    try {
      const targetTable = getTableForCategory(lookupCategory)
      const nextSortOrder = options.filter((o) => o.category === lookupCategory).length + 1
      const payload: any = {
        name: lookupValue,
        sort_order: nextSortOrder,
        is_active: true
      }
      const { error } = await supabase
        .from(targetTable)
        .insert(payload)
      if (error) throw error
      setLookupValue('')
      refreshOptions()
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถเพิ่มตัวเลือกคัดกรองได้: ${err.message}`, 'danger')
    }
  }

  const handleDeleteLookup = (id: string, category?: string) => {
    triggerConfirm({
      title: 'ลบตัวเลือกคัดกรอง?',
      description: 'คุณแน่ใจว่าต้องการลบตัวเลือกคัดกรองนี้ออกจากระบบหรือไม่?',
      confirmLabel: 'ลบตัวเลือก',
      variant: 'danger',
      onConfirm: async () => {
        const item = options.find((o) => o.id === id)
        const targetCategory = category || item?.category || lookupCategory
        const targetTable = getTableForCategory(targetCategory)
        const { error } = await supabase
          .from(targetTable)
          .delete()
          .eq('id', id)
        if (error) throw error
        refreshOptions()
      }
    })
  }

  const handleUpdateRole = async (userId: string, newRole: string, fullName?: string) => {
    try {
      const updatePayload: any = { role: newRole }
      if (fullName !== undefined) {
        updatePayload.full_name = fullName
      }
      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
      if (error) throw error
      fetchProfiles()
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้: ${err.message}`, 'danger')
    }
  }

  const handleAddUser = async (email: string, password: string, role: string) => {
    try {
      const tempClient = createAnonClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      )

      const { data, error } = await tempClient.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            created_by_admin: true
          }
        }
      })

      if (error) throw error

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email.trim(),
            role: role || 'teacher',
          })

        if (profileError) {
          console.error('Error updating profile role:', profileError)
        }
      }

      triggerAlert('สำเร็จ', `เพิ่มผู้ใช้งาน ${email} เรียบร้อยแล้ว!`, 'primary')
      fetchProfiles()
    } catch (err: any) {
      const rawMsg = err?.message || err?.error_description || (typeof err === 'string' ? err : 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน')
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถเพิ่มผู้ใช้งานได้: ${rawMsg}`, 'danger')
      throw new Error(rawMsg)
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
      triggerAlert('บันทึกสำเร็จ', 'บันทึกรายละเอียดคลินิกเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถอัปเดตข้อมูลคลินิกได้: ${err.message}`, 'danger')
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
      triggerAlert('สำเร็จ', 'เพิ่มกิจกรรมสัมมนาเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถเพิ่มกิจกรรมได้: ${err.message}`, 'danger')
    }
  }

  // Clinic Delete Event
  const handleDeleteEvent = (id: string) => {
    triggerConfirm({
      title: 'ลบกิจกรรม?',
      description: 'คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมสัมมนานี้ออกจากระบบ?',
      confirmLabel: 'ลบกิจกรรม',
      variant: 'danger',
      onConfirm: async () => {
        const { error } = await supabase.from('clinic_events').delete().eq('id', id)
        if (error) throw error
        fetchClinicEvents()
      }
    })
  }

  // Update Appointment Status and Notes
  const handleUpdateAppStatus = async (appId: string, status: string, notes: string) => {
    try {
      const { error } = await supabase.from('appointments').update({ status, admin_notes: notes }).eq('id', appId)
      if (error) throw error
      setAppEditing(null)
      fetchAppointments()
      triggerAlert('สำเร็จ', 'อัปเดตสถานะนัดหมายเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถอัปเดตสถานะนัดหมายได้: ${err.message}`, 'danger')
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
      triggerAlert('สำเร็จ', 'เพิ่มฟอร์มดาวน์โหลดเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถเพิ่มแบบฟอร์มได้: ${err.message}`, 'danger')
    }
  }

  // Delete Downloadable Form
  const handleDeleteDownloadableForm = (id: string) => {
    triggerConfirm({
      title: 'ลบแบบฟอร์ม?',
      description: 'คุณแน่ใจหรือไม่ว่าต้องการลบแบบฟอร์มดาวน์โหลดนี้ออกจากระบบ?',
      confirmLabel: 'ลบแบบฟอร์ม',
      variant: 'danger',
      onConfirm: async () => {
        const { error } = await supabase.from('downloadable_forms').delete().eq('id', id)
        if (error) throw error
        fetchDownloadableForms()
      }
    })
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
      triggerAlert('สำเร็จ', 'อัปเดตข้อมูลการยื่นขอจริยธรรมเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถอัปเดตข้อมูลการยื่นขอจริยธรรมได้: ${err.message}`, 'danger')
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
      triggerAlert('สำเร็จ', 'อัปเดตคำขอทรัพย์สินทางปัญญาเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถอัปเดตข้อมูลทรัพย์สินทางปัญญาได้: ${err.message}`, 'danger')
    }
  }

  // Transfer IP to main wisdom catalog
  const handleTransferToCatalog = (app: any) => {
    if (!app.request_number) {
      triggerAlert('โปรดระบุข้อมูล', 'โปรดระบุเลขที่คำขอสิทธิบัตร/อนุสิทธิบัตรก่อนทำการโอนเข้าคลังหลัก', 'warning')
      return
    }
    triggerConfirm({
      title: 'โอนเข้าคลังหลัก?',
      description: 'ยืนยันการโอนย้ายคำขอนี้เข้าสู่ คลังทรัพย์สินทางปัญญาหลัก?',
      confirmLabel: 'ยืนยันโอนย้าย',
      variant: 'primary',
      onConfirm: async () => {
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

        triggerAlert('สำเร็จ', 'โอนย้ายผลงานเข้าสู่คลังทรัพย์สินทางปัญญาหลักเรียบร้อยแล้ว!', 'primary')
        fetchIpApplications()
      }
    })
  }

  const handleDownloadPrivateFile = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('wisdom-private').createSignedUrl(path, 60)
      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถดาวน์โหลดไฟล์ได้: ${err.message}`, 'danger')
    }
  }

  const getSubtypeCategoryForForm = () => {
    switch (formCategory) {
      case 'research': return 'research_type'
      case 'innovation': return 'innovation_type'
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
      to: '/clinic',
    })),
    ...pendingEthicsSubs.map((s: any) => ({
      id: `eth-${s.id}`,
      icon: Clipboard,
      kind: 'จริยธรรมรอมอบหมาย',
      title: s.project_title,
      who: profiles.find((p) => p.id === s.submitter_id)?.email || 'ไม่ระบุผู้ใช้',
      createdAt: s.created_at,
      to: '/ethics',
    })),
    ...pendingIpApps.map((a: any) => ({
      id: `ip-${a.id}`,
      icon: Award,
      kind: 'คำขอ IP รอดำเนินการ',
      title: a.title,
      who: profiles.find((p) => p.id === a.applicant_id)?.email || 'ไม่ระบุผู้ใช้',
      createdAt: a.created_at,
      to: '/ip-application',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const currentSlug = location.pathname === '/master'
    ? ''
    : location.pathname.split('/master/')[1]?.split('/')[0] || ''
  const subSlug = location.pathname.split('/')[3] || ''

  const getHeaderInfo = () => {
    switch (currentSlug) {
      case 'items': {
        if (subSlug === 'research') {
          return {
            title: 'จัดการผลงานวิจัย',
            subtitle: 'รายการผลงานวิจัยและโครงการทุนวิจัยทั้งหมดในระบบคลังหลัก',
            recordCode: 'MST-ITEMS-RES'
          }
        }
        if (subSlug === 'innovation') {
          return {
            title: 'จัดการนวัตกรรม',
            subtitle: 'รายการสิ่งประดิษฐ์และนวัตกรรมใหม่ทั้งหมดในระบบคลังหลัก',
            recordCode: 'MST-ITEMS-INV'
          }
        }
        if (subSlug === 'intellectual_property') {
          return {
            title: 'จัดการทรัพย์สินทางปัญญา',
            subtitle: 'รายการผลงานทรัพย์สินทางปัญญาที่ขึ้นทะเบียนแล้วทั้งหมดในระบบคลังหลัก',
            recordCode: 'MST-ITEMS-IP'
          }
        }
        if (subSlug === 'award') {
          return {
            title: 'จัดการรางวัลและความสำเร็จ',
            subtitle: 'รายการรางวัลและความสำเร็จทั้งหมดในระบบคลังหลัก',
            recordCode: 'MST-ITEMS-AWD'
          }
        }
        if (subSlug === 'utilization') {
          return {
            title: 'จัดการการนำไปใช้ประโยชน์',
            subtitle: 'รายการการนำวิจัยและนวัตกรรมไปใช้ประโยชน์ทั้งหมดในระบบคลังหลัก',
            recordCode: 'MST-ITEMS-UTL'
          }
        }
        return {
          title: 'จัดการผลงาน',
          subtitle: 'รายการผลงานวิจัย นวัตกรรม รางวัล และการนำไปใช้ประโยชน์ในระบบคลังหลัก',
          recordCode: 'MST-ITEMS'
        }
      }
      case 'lookups':
        return {
          title: 'ตัวเลือกคัดกรอง',
          subtitle: 'จัดการตัวเลือกตัวคัดกรองข้อมูลกลาง (เช่น ประเภทวิจัย คณะหน่วยงาน ระดับรางวัล)',
          recordCode: 'MST-LOOKUP'
        }
      case 'users':
        return {
          title: 'จัดการผู้ใช้งานและสิทธิ์',
          subtitle: 'ตรวจสอบรายชื่อคณาจารย์ บุคลากร และตั้งค่าระดับการเข้าถึงระบบของแต่ละบัญชี',
          recordCode: 'MST-USERS'
        }
      case 'roles':
        return {
          title: 'จัดการสิทธิ์เข้าถึงหน้าเว็บ',
          subtitle: 'กำหนดสิทธิ์ว่าผู้ใช้งานระดับต่างๆ (Admin, Expert, Teacher) สามารถมองเห็นหรือเข้าใช้งานหน้าส่วนใดได้บ้าง',
          recordCode: 'MST-ROLES'
        }
      case 'clinic':
        return {
          title: 'คลินิกวิจัย (ระบบนัดหมาย)',
          subtitle: 'จัดการคำขอนัดหมายขอคำปรึกษางานวิจัยและประสานงานอาจารย์ผู้เชี่ยวชาญ',
          recordCode: 'MST-CLN'
        }
      case 'ethics':
        return {
          title: 'คิวพิจารณาจริยธรรมการวิจัย',
          subtitle: 'ตรวจสอบข้อเสนอโครงการวิจัยที่ยื่นขอรับการรับรองจริยธรรมการวิจัยในมนุษย์และมอบหมายผู้ทรงคุณวุฒิ',
          recordCode: 'MST-ETH'
        }
      case 'ip':
        return {
          title: 'คิวคำขอจดสิทธิ์ทางปัญญา',
          subtitle: 'ตรวจสอบ ติดตามความคืบหน้า และขึ้นทะเบียนผลงานทรัพย์สินทางปัญญาเข้าสู่ระบบคลังหลัก',
          recordCode: 'MST-IP'
        }
      default:
        return {
          title: 'โต๊ะทำงานของแอดมินวันนี้',
          subtitle: 'สรุปคิวงานด่วนที่รอดำเนินการ (นัดหมายคลินิก คิวจริยธรรม และทรัพย์สินทางปัญญา)',
          recordCode: 'MST-DASH'
        }
    }
  }

  const headerInfo = getHeaderInfo()

  return (
    <div className="flex-1 animate-fadeIn text-slate-800">
      <PageHeader
        title={headerInfo.title}
        subtitle={headerInfo.subtitle}
        extraBadge="Masterdata Console"
      />

      {(() => {
        const getActiveTab = () => {
          const path = pathname
          if (path.startsWith('/master/clinic')) return 'clinic'
          if (path.startsWith('/master/ethics')) return 'ethics'
          if (path.startsWith('/master/ip')) return 'ip'
          if (path.startsWith('/master/masters') || path.startsWith('/master/lookups')) return 'masters'
          if (path.startsWith('/master/users')) return 'users'
          if (path.startsWith('/master/roles')) return 'roles'
          if (path.startsWith('/master/items')) return 'items'
          return 'overview'
        }
        const activeTab = getActiveTab()
        // Extract category slug from path e.g. /master/items/research -> 'research'
        const itemCategory = pathname.startsWith('/master/items/')
          ? pathname.split('/master/items/')[1]?.split('/')[0] || ''
          : ''
        const lookupPathCategory = pathname.startsWith('/master/masters/')
          ? pathname.split('/master/masters/')[1]?.split('/')[0] || ''
          : pathname.startsWith('/master/lookups/')
          ? pathname.split('/master/lookups/')[1]?.split('/')[0] || ''
          : ''

        switch (activeTab) {
          case 'overview':
            return (
              <OverviewTab
                pendingAppointmentsCount={pendingAppointments.length}
                pendingEthicsCount={pendingEthicsSubs.length}
                pendingIpCount={pendingIpApps.length}
                deskItems={deskItems}
              />
            )
          case 'items':
            return (
              <ItemsTab
                items={items}
                itemsLoading={itemsLoading}
                itemSearch={itemSearch}
                setItemSearch={setItemSearch}
                getCategoryLabel={getCategoryLabel}
                onOpenAddForm={handleOpenAddForm}
                onOpenEditForm={handleOpenEditForm}
                onDeleteItem={handleDeleteItem}
                category={itemCategory}
                profiles={profiles}
              />
            )
          case 'masters':
            return (
              <MastersTab
                options={options}
                lookupCategory={lookupCategory}
                setLookupCategory={setLookupCategory}
                lookupValue={lookupValue}
                setLookupValue={setLookupValue}
                onAddLookup={handleAddLookup}
                onDeleteLookup={handleDeleteLookup}
                defaultCategory={lookupPathCategory}
              />
            )
          case 'users':
            return (
              <UsersTab profiles={profiles} usersLoading={usersLoading} items={items} onUpdateRole={handleUpdateRole} onAddUser={handleAddUser} />
            )
          case 'roles':
            return <RolesTab />
          case 'clinic':
            return (
              <ClinicTab
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
              />
            )
          case 'ethics':
            return (
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
              />
            )
          case 'ip':
            return (
              <IpTab
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
            )
          default:
            return null
        }
      })()}

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
        profiles={profiles}
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
        imageFile={imageFile}
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
        metaScope={metaScope}
        setMetaScope={setMetaScope}
        metaJournalRank={metaJournalRank}
        setMetaJournalRank={setMetaJournalRank}
        metaContribution={metaContribution}
        setMetaContribution={setMetaContribution}
        metaFundingHas={metaFundingHas}
        setMetaFundingHas={setMetaFundingHas}
        metaFundingDetail={metaFundingDetail}
        setMetaFundingDetail={setMetaFundingDetail}
        metaSource={metaSource}
        setMetaSource={setMetaSource}
        metaIpStatus={metaIpStatus}
        setMetaIpStatus={setMetaIpStatus}
        metaApplicationStatus={metaApplicationStatus}
        setMetaApplicationStatus={setMetaApplicationStatus}
        metaIpCurrentStatus={metaIpCurrentStatus}
        setMetaIpCurrentStatus={setMetaIpCurrentStatus}
        metaPatentNum={metaPatentNum}
        setMetaPatentNum={setMetaPatentNum}
        metaCreatorType={metaCreatorType}
        setMetaCreatorType={setMetaCreatorType}
        metaAwardName={metaAwardName}
        setMetaAwardName={setMetaAwardName}
        metaUtilizationDate={metaUtilizationDate}
        setMetaUtilizationDate={setMetaUtilizationDate}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setConfirmConfig(null)
        }}
        onConfirm={handleConfirmAction}
        title={confirmConfig?.title || ''}
        description={confirmConfig?.description || ''}
        confirmLabel={confirmConfig?.confirmLabel || 'ยืนยัน'}
        variant={confirmConfig?.variant || 'primary'}
        loading={confirmLoading}
        alertOnly={confirmConfig?.alertOnly || false}
      />
    </div>
  )
}

