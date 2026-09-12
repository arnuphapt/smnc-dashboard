'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WisdomItem } from '@/components/views/Dashboard'

interface UseMasterdataItemsParams {
  triggerConfirm: (config: {
    title: string
    description: string
    confirmLabel?: string
    variant?: 'danger' | 'primary' | 'warning'
    alertOnly?: boolean
    onConfirm: () => Promise<void>
  }) => void
  triggerAlert: (title: string, description: string, variant?: 'primary' | 'danger' | 'warning') => void
}

export function useMasterdataItems({ triggerConfirm, triggerAlert }: UseMasterdataItemsParams) {
  const supabase = createClient()

  const [items, setItems] = useState<WisdomItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemSearch, setItemSearch] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

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
  const [metaFiscalYear, setMetaFiscalYear] = useState('')
  const [metaAcademicYear, setMetaAcademicYear] = useState('')
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
  const [metaPublished, setMetaPublished] = useState('')
  const [metaPresented, setMetaPresented] = useState('')
  const [metaSubmissionDate, setMetaSubmissionDate] = useState('')
  const [metaNotes, setMetaNotes] = useState('')

  const fetchItems = async () => {
    setItemsLoading(true)
    try {
      const { data, error } = await supabase
        .from('wisdom_items')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถดึงข้อมูลผลงานได้: ${err.message}`, 'danger')
    } finally {
      setItemsLoading(false)
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
    setMetaFiscalYear('')
    setMetaAcademicYear('')
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
    setMetaCreatorType('')
    setMetaAwardName('')
    setMetaUtilizationDate('')
    setMetaPublished('')
    setMetaPresented('')
    setMetaSubmissionDate('')
    setMetaNotes('')

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
        item.metadata.utilization_type ||
        ''
    )
    setMetaYear(item.metadata.year || item.metadata.year_be || '')
    setMetaFiscalYear(item.metadata.fiscal_year || '')
    setMetaAcademicYear(item.metadata.academic_year || '')
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
    setMetaPublished(item.metadata.published || '')
    setMetaPresented(item.metadata.presented || '')
    setMetaSubmissionDate(item.metadata.submission_date || '')
    setMetaNotes(item.metadata.notes || item.metadata.remarks || '')

    setIsFormOpen(true)
  }

  const uploadFile = async (file: File, folder: string, isPublic: boolean): Promise<string> => {
    const bucket = folder === 'images' ? 'wisdom-public' : isPublic ? 'wisdom-public' : 'wisdom-private'
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

      const [uploadedImageUrl, uploadedFileUrl] = await Promise.all([
        imageFile ? uploadFile(imageFile, 'images', formIsPublic) : Promise.resolve(imageUrl),
        docFile ? uploadFile(docFile, 'files', formIsPublic) : Promise.resolve(fileUrl),
      ])
      imageUrl = uploadedImageUrl
      fileUrl = uploadedFileUrl

      const metadata: any = {
        department: metaDept,
        year: metaYear,
        fiscal_year: metaFiscalYear,
        academic_year: metaAcademicYear,
      }

      if (formCategory === 'research') {
        metadata.research_type = metaSubtype
        metadata.journal_name = metaJournal
        metadata.journal_rank = metaJournalRank
        metadata.scope = metaScope
        metadata.contribution = metaContribution
        metadata.funding =
          metaFundingHas === 'มี' ? (metaFundingDetail.trim() ? `มี - ${metaFundingDetail.trim()}` : 'มี') : 'ไม่มี'
      } else if (formCategory === 'innovation') {
        metadata.innovation_type = metaSubtype
        metadata.scope = metaScope
        metadata.source = metaSource
        metadata.ip_status = metaIpStatus
        metadata.award_name = metaAwardName
        metadata.creator_type = metaCreatorType
        metadata.published = metaPublished
        metadata.presented = metaPresented
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
        metadata.submission_date = metaSubmissionDate
        metadata.notes = metaNotes
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
        updated_at: new Date().toISOString(),
      }

      if (editingItem) {
        const { error } = await supabase.from('wisdom_items').update(rowData).eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { data: userData } = await supabase.auth.getUser()
        const { error } = await supabase.from('wisdom_items').insert({
          ...rowData,
          created_by: userData.user?.id,
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
        const { error } = await supabase.from('wisdom_items').delete().eq('id', id)
        if (error) throw error
        fetchItems()
      },
    })
  }

  const getSubtypeCategoryForForm = () => {
    switch (formCategory) {
      case 'research':
        return 'research_type'
      case 'innovation':
        return 'innovation_type'
      case 'intellectual_property':
        return 'ip_type'
      case 'award':
        return 'award_level'
      case 'utilization':
        return 'utilization_type'
      default:
        return ''
    }
  }

  const getSubtypeLabelForForm = () => {
    switch (formCategory) {
      case 'research':
        return 'ประเภทงานวิจัย'
      case 'innovation':
        return 'ประเภทนวัตกรรม'
      case 'intellectual_property':
        return 'ประเภททรัพย์สินทางปัญญา'
      case 'award':
        return 'ระดับรางวัล'
      case 'utilization':
        return 'ประเภทการนำไปใช้'
      default:
        return 'ประเภทย่อย'
    }
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'research':
        return 'วิจัย'
      case 'innovation':
        return 'นวัตกรรม'
      case 'intellectual_property':
        return 'ทรัพย์สินทางปัญญา'
      case 'award':
        return 'รางวัล'
      case 'utilization':
        return 'การใช้ประโยชน์'
      default:
        return cat
    }
  }

  return {
    items,
    setItems,
    itemsLoading,
    fetchItems,
    itemSearch,
    setItemSearch,
    submitLoading,
    isFormOpen,
    setIsFormOpen,
    editingItem,
    setEditingItem,
    formCategory,
    setFormCategory,
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    formAuthors,
    setFormAuthors,
    formIsPublic,
    setFormIsPublic,
    imageFile,
    setImageFile,
    docFile,
    setDocFile,
    metaDept,
    setMetaDept,
    metaSubtype,
    setMetaSubtype,
    metaYear,
    setMetaYear,
    metaFiscalYear,
    setMetaFiscalYear,
    metaAcademicYear,
    setMetaAcademicYear,
    metaJournal,
    setMetaJournal,
    metaRegNum,
    setMetaRegNum,
    metaRegDate,
    setMetaRegDate,
    metaOrganizer,
    setMetaOrganizer,
    metaOrgUsed,
    setMetaOrgUsed,
    metaImpact,
    setMetaImpact,
    metaScope,
    setMetaScope,
    metaJournalRank,
    setMetaJournalRank,
    metaContribution,
    setMetaContribution,
    metaFundingHas,
    setMetaFundingHas,
    metaFundingDetail,
    setMetaFundingDetail,
    metaSource,
    setMetaSource,
    metaIpStatus,
    setMetaIpStatus,
    metaApplicationStatus,
    setMetaApplicationStatus,
    metaIpCurrentStatus,
    setMetaIpCurrentStatus,
    metaPatentNum,
    setMetaPatentNum,
    metaCreatorType,
    setMetaCreatorType,
    metaAwardName,
    setMetaAwardName,
    metaUtilizationDate,
    setMetaUtilizationDate,
    metaPublished,
    setMetaPublished,
    metaPresented,
    setMetaPresented,
    metaSubmissionDate,
    setMetaSubmissionDate,
    metaNotes,
    setMetaNotes,
    handleOpenAddForm,
    handleOpenEditForm,
    handleItemSubmit,
    handleDeleteItem,
    getSubtypeCategoryForForm,
    getSubtypeLabelForForm,
    getCategoryLabel,
    uploadFile,
  }
}
