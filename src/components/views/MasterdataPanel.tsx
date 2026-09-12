'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createClient as createAnonClient } from '@supabase/supabase-js'

const supabase = createClient()
import { useMasters } from '@/context/MasterContext'
import { getTableForCategory, getValueFieldForCategory } from '@/utils/masterTables'
import { Calendar, Award, Clipboard } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { OverviewTab } from './masterdata/OverviewTab'
import { ItemsTab } from './masterdata/ItemsTab'
import { ItemFormModal } from './masterdata/ItemFormModal'
import { MastersTab } from './masterdata/MastersTab'
import { UsersTab } from './masterdata/UsersTab'
import { ClinicTab } from './masterdata/ClinicTab'
import { EthicsTab } from './masterdata/EthicsTab'
import { RolesTab } from './masterdata/RolesTab'
import { ConfirmDialog } from '@/components/ConfirmDialog'

import { useMasterdataItems } from '@/hooks/masterdata/useMasterdataItems'
import { useMasterdataClinic } from '@/hooks/masterdata/useMasterdataClinic'
import { useMasterdataForms } from '@/hooks/masterdata/useMasterdataForms'
import { useMasterdataIP } from '@/hooks/masterdata/useMasterdataIP'
import { useProfiles } from '@/hooks/queries/useProfiles'

export const MasterdataPanel: React.FC = () => {
  const { options, getOptionsByCategory, refreshOptions } = useMasters()
  const pathname = usePathname()

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
      onConfirm: async () => {},
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

  // Users & Profiles State
  const { profiles, isFetching: usersLoading, refetchProfiles: fetchProfiles } = useProfiles()

  // Ethics & Attachments for Overview desk
  const [ethicsSubmissions, setEthicsSubmissions] = useState<any[]>([])

  // Hook 1: Items Management
  const itemsHook = useMasterdataItems({ triggerConfirm, triggerAlert })

  // Hook 2: Clinic & Appointments Management
  const clinicHook = useMasterdataClinic({ triggerConfirm, triggerAlert })

  // Hook 3: Downloadable Forms Management
  const formsHook = useMasterdataForms({ triggerConfirm, triggerAlert })

  // Hook 4: Intellectual Property Management
  const ipHook = useMasterdataIP({ profiles, triggerConfirm, triggerAlert })

  // Lookups Form State
  const [lookupCategory, setLookupCategory] = useState('research_type')
  const [lookupValue, setLookupValue] = useState('')

  const fetchEthicsSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('ethics_submissions')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setEthicsSubmissions(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    itemsHook.fetchItems()
    clinicHook.fetchAppointments()
    clinicHook.fetchClinicEvents()
    clinicHook.fetchClinicDesc()
    fetchEthicsSubmissions()
    formsHook.fetchDownloadableForms()
    ipHook.fetchIpApplications()
  }, [])

  const handleAddLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookupValue) return
    try {
      const targetTable = getTableForCategory(lookupCategory)
      const valueField = getValueFieldForCategory(lookupCategory)
      const nextSortOrder = options.filter((o) => o.category === lookupCategory).length + 1
      const payload: any = {
        [valueField]: lookupValue,
        sort_order: nextSortOrder,
        is_active: true,
      }
      const { error } = await supabase.from(targetTable).insert(payload)
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
        const { error } = await supabase.from(targetTable).delete().eq('id', id)
        if (error) throw error
        refreshOptions()
      },
    })
  }

  const handleUpdateRole = async (userId: string, newRole: string, fullName?: string) => {
    try {
      const updatePayload: any = { role: newRole }
      if (fullName !== undefined) {
        updatePayload.full_name = fullName
      }
      const { error } = await supabase.from('profiles').update(updatePayload).eq('id', userId)
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
            created_by_admin: true,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
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
      const rawMsg =
        err?.message || err?.error_description || (typeof err === 'string' ? err : 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน')
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถเพิ่มผู้ใช้งานได้: ${rawMsg}`, 'danger')
      throw new Error(rawMsg)
    }
  }

  // Desk items calculation for Overview tab
  const pendingAppointments = clinicHook.appointments.filter((a: any) => a.status === 'pending')
  const pendingEthicsSubs = ethicsSubmissions.filter((s: any) => s.status === 'ยื่นแล้ว')
  const pendingIpApps = ipHook.ipApplications.filter((a: any) => a.status === 'ยื่นคำขอ')

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

  const currentSlug =
    pathname === '/master' ? '' : pathname.split('/master/')[1]?.split('/')[0] || ''
  const subSlug = pathname.split('/')[3] || ''

  const getHeaderInfo = () => {
    switch (currentSlug) {
      case 'items': {
        if (subSlug === 'research') {
          return {
            title: 'จัดการผลงานวิจัย',
            subtitle: 'รายการผลงานวิจัยและโครงการทุนวิจัยทั้งหมดในระบบคลังหลัก',
            recordCode: 'MST-ITEMS-RES',
          }
        }
        if (subSlug === 'innovation') {
          return {
            title: 'จัดการนวัตกรรม',
            subtitle: 'รายการสิ่งประดิษฐ์และนวัตกรรมใหม่ทั้งหมดในระบบคลังหลัก',
            recordCode: 'MST-ITEMS-INV',
          }
        }
        if (subSlug === 'intellectual_property') {
          return {
            title: 'จัดการทรัพย์สินทางปัญญา',
            subtitle: 'รายการผลงานทรัพย์สินทางปัญญาที่ขึ้นทะเบียนแล้วทั้งหมดในระบบคลังหลัก',
            recordCode: 'MST-ITEMS-IP',
          }
        }
        if (subSlug === 'award') {
          return {
            title: 'จัดการรางวัลและความสำเร็จ',
            subtitle: 'รายการรางวัลและความสำเร็จทั้งหมดในระบบคลังหลัก',
            recordCode: 'MST-ITEMS-AWD',
          }
        }
        if (subSlug === 'utilization') {
          return {
            title: 'จัดการการนำไปใช้ประโยชน์',
            subtitle: 'รายการการนำวิจัยและนวัตกรรมไปใช้ประโยชน์ทั้งหมดในระบบคลังหลัก',
            recordCode: 'MST-ITEMS-UTL',
          }
        }
        return {
          title: 'จัดการผลงาน',
          subtitle: 'รายการผลงานวิจัย นวัตกรรม รางวัล และการนำไปใช้ประโยชน์ในระบบคลังหลัก',
          recordCode: 'MST-ITEMS',
        }
      }
      case 'lookups':
        return {
          title: 'ตัวเลือกคัดกรอง',
          subtitle: 'จัดการตัวเลือกตัวคัดกรองข้อมูลกลาง (เช่น ประเภทวิจัย คณะหน่วยงาน ระดับรางวัล)',
          recordCode: 'MST-LOOKUP',
        }
      case 'users':
        return {
          title: 'จัดการผู้ใช้งานและสิทธิ์',
          subtitle: 'ตรวจสอบรายชื่อคณาจารย์ บุคลากร และตั้งค่าระดับการเข้าถึงระบบของแต่ละบัญชี',
          recordCode: 'MST-USERS',
        }
      case 'roles':
        return {
          title: 'จัดการสิทธิ์เข้าถึงหน้าเว็บ',
          subtitle:
            'กำหนดสิทธิ์ว่าผู้ใช้งานระดับต่างๆ (Admin, Expert, Teacher) สามารถมองเห็นหรือเข้าใช้งานหน้าส่วนใดได้บ้าง',
          recordCode: 'MST-ROLES',
        }
      case 'event':
        return {
          title: 'Master Event (คลินิกวิจัย)',
          subtitle: 'จัดการกิจกรรม คำขอนัดหมายขอคำปรึกษางานวิจัย และประสานงานอาจารย์ผู้เชี่ยวชาญ',
          recordCode: 'MST-EVT',
        }
      case 'forms':
        return {
          title: 'Master Forms (จริยธรรม & ทรัพย์สินทางปัญญา)',
          subtitle: 'จัดการแบบฟอร์มดาวน์โหลดสำหรับจริยธรรมการวิจัย ทรัพย์สินทางปัญญา และการนำไปใช้ประโยชน์',
          recordCode: 'MST-FORM',
        }
      default:
        return {
          title: 'Masterdata',
          subtitle: 'สรุปคิวงานด่วนที่รอดำเนินการ (นัดหมายคลินิก คิวจริยธรรม และทรัพย์สินทางปัญญา)',
          recordCode: 'MST-DASH',
        }
    }
  }

  const headerInfo = getHeaderInfo()

  return (
    <div className="flex-1 animate-fadeIn text-slate-800">
      <PageHeader title={headerInfo.title} subtitle={headerInfo.subtitle} extraBadge="Masterdata Console" />

      {(() => {
        const getActiveTab = () => {
          const path = pathname
          if (path.startsWith('/master/event') || path.startsWith('/master/clinic')) return 'event'
          if (path.startsWith('/master/forms') || path.startsWith('/master/ethics') || path.startsWith('/master/ip'))
            return 'forms'
          if (path.startsWith('/master/masters') || path.startsWith('/master/lookups')) return 'masters'
          if (path.startsWith('/master/users')) return 'users'
          if (path.startsWith('/master/roles')) return 'roles'
          if (path.startsWith('/master/items')) return 'items'
          return 'overview'
        }
        const activeTab = getActiveTab()
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
                items={itemsHook.items}
                itemsLoading={itemsHook.itemsLoading}
                itemSearch={itemsHook.itemSearch}
                setItemSearch={itemsHook.setItemSearch}
                getCategoryLabel={itemsHook.getCategoryLabel}
                onOpenAddForm={itemsHook.handleOpenAddForm}
                onOpenEditForm={itemsHook.handleOpenEditForm}
                onDeleteItem={itemsHook.handleDeleteItem}
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
                onRefresh={refreshOptions}
              />
            )
          case 'users':
            return (
              <UsersTab
                profiles={profiles}
                usersLoading={usersLoading}
                items={itemsHook.items}
                onUpdateRole={handleUpdateRole}
                onAddUser={handleAddUser}
              />
            )
          case 'roles':
            return <RolesTab />
          case 'event':
            return (
              <ClinicTab
                newEvTitle={clinicHook.newEvTitle}
                setNewEvTitle={clinicHook.setNewEvTitle}
                newEvDesc={clinicHook.newEvDesc}
                setNewEvDesc={clinicHook.setNewEvDesc}
                newEvDate={clinicHook.newEvDate}
                setNewEvDate={clinicHook.setNewEvDate}
                newEvLoc={clinicHook.newEvLoc}
                setNewEvLoc={clinicHook.setNewEvLoc}
                newEvCap={clinicHook.newEvCap}
                setNewEvCap={clinicHook.setNewEvCap}
                onAddEvent={clinicHook.handleAddEvent}
                clinicEvents={clinicHook.clinicEvents}
                onDeleteEvent={clinicHook.handleDeleteEvent}
              />
            )
          case 'forms':
            return (
              <div className="space-y-8">
                <EthicsTab
                  newFormTitle={formsHook.newFormTitle}
                  setNewFormTitle={formsHook.setNewFormTitle}
                  newFormCat={formsHook.newFormCat}
                  setNewFormCat={formsHook.setNewFormCat}
                  newFormUrl={formsHook.newFormUrl}
                  setNewFormUrl={formsHook.setNewFormUrl}
                  onAddDownloadableForm={formsHook.handleAddDownloadableForm}
                  downloadableForms={formsHook.downloadableForms}
                  onDeleteDownloadableForm={formsHook.handleDeleteDownloadableForm}
                  uploadFile={itemsHook.uploadFile}
                />
              </div>
            )
          default:
            return null
        }
      })()}

      <ItemFormModal
        isFormOpen={itemsHook.isFormOpen}
        setIsFormOpen={itemsHook.setIsFormOpen}
        editingItem={itemsHook.editingItem}
        submitLoading={itemsHook.submitLoading}
        onSubmit={itemsHook.handleItemSubmit}
        getOptionsByCategory={getOptionsByCategory}
        getCategoryLabel={itemsHook.getCategoryLabel}
        getSubtypeCategoryForForm={itemsHook.getSubtypeCategoryForForm}
        getSubtypeLabelForForm={itemsHook.getSubtypeLabelForForm}
        profiles={profiles}
        formCategory={itemsHook.formCategory}
        setFormCategory={itemsHook.setFormCategory}
        formTitle={itemsHook.formTitle}
        setFormTitle={itemsHook.setFormTitle}
        formDescription={itemsHook.formDescription}
        setFormDescription={itemsHook.setFormDescription}
        formAuthors={itemsHook.formAuthors}
        setFormAuthors={itemsHook.setFormAuthors}
        formIsPublic={itemsHook.formIsPublic}
        setFormIsPublic={itemsHook.setFormIsPublic}
        imageFile={itemsHook.imageFile}
        setImageFile={itemsHook.setImageFile}
        setDocFile={itemsHook.setDocFile}
        metaDept={itemsHook.metaDept}
        setMetaDept={itemsHook.setMetaDept}
        metaSubtype={itemsHook.metaSubtype}
        setMetaSubtype={itemsHook.setMetaSubtype}
        metaYear={itemsHook.metaYear}
        setMetaYear={itemsHook.setMetaYear}
        metaFiscalYear={itemsHook.metaFiscalYear}
        setMetaFiscalYear={itemsHook.setMetaFiscalYear}
        metaAcademicYear={itemsHook.metaAcademicYear}
        setMetaAcademicYear={itemsHook.setMetaAcademicYear}
        metaJournal={itemsHook.metaJournal}
        setMetaJournal={itemsHook.setMetaJournal}
        metaRegNum={itemsHook.metaRegNum}
        setMetaRegNum={itemsHook.setMetaRegNum}
        metaRegDate={itemsHook.metaRegDate}
        setMetaRegDate={itemsHook.setMetaRegDate}
        metaOrganizer={itemsHook.metaOrganizer}
        setMetaOrganizer={itemsHook.setMetaOrganizer}
        metaOrgUsed={itemsHook.metaOrgUsed}
        setMetaOrgUsed={itemsHook.setMetaOrgUsed}
        metaImpact={itemsHook.metaImpact}
        setMetaImpact={itemsHook.setMetaImpact}
        metaScope={itemsHook.metaScope}
        setMetaScope={itemsHook.setMetaScope}
        metaJournalRank={itemsHook.metaJournalRank}
        setMetaJournalRank={itemsHook.setMetaJournalRank}
        metaContribution={itemsHook.metaContribution}
        setMetaContribution={itemsHook.setMetaContribution}
        metaFundingHas={itemsHook.metaFundingHas}
        setMetaFundingHas={itemsHook.setMetaFundingHas}
        metaFundingDetail={itemsHook.metaFundingDetail}
        setMetaFundingDetail={itemsHook.setMetaFundingDetail}
        metaSource={itemsHook.metaSource}
        setMetaSource={itemsHook.setMetaSource}
        metaIpStatus={itemsHook.metaIpStatus}
        setMetaIpStatus={itemsHook.setMetaIpStatus}
        metaApplicationStatus={itemsHook.metaApplicationStatus}
        setMetaApplicationStatus={itemsHook.setMetaApplicationStatus}
        metaIpCurrentStatus={itemsHook.metaIpCurrentStatus}
        setMetaIpCurrentStatus={itemsHook.setMetaIpCurrentStatus}
        metaPatentNum={itemsHook.metaPatentNum}
        setMetaPatentNum={itemsHook.setMetaPatentNum}
        metaCreatorType={itemsHook.metaCreatorType}
        setMetaCreatorType={itemsHook.setMetaCreatorType}
        metaAwardName={itemsHook.metaAwardName}
        setMetaAwardName={itemsHook.setMetaAwardName}
        metaUtilizationDate={itemsHook.metaUtilizationDate}
        setMetaUtilizationDate={itemsHook.setMetaUtilizationDate}
        metaPublished={itemsHook.metaPublished}
        setMetaPublished={itemsHook.setMetaPublished}
        metaPresented={itemsHook.metaPresented}
        setMetaPresented={itemsHook.setMetaPresented}
        metaSubmissionDate={itemsHook.metaSubmissionDate}
        setMetaSubmissionDate={itemsHook.setMetaSubmissionDate}
        metaNotes={itemsHook.metaNotes}
        setMetaNotes={itemsHook.setMetaNotes}
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
