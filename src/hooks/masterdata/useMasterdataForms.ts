'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseMasterdataFormsParams {
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

export function useMasterdataForms({ triggerConfirm, triggerAlert }: UseMasterdataFormsParams) {
  const supabase = createClient()

  const [downloadableForms, setDownloadableForms] = useState<any[]>([])
  const [newFormTitle, setNewFormTitle] = useState('')
  const [newFormCat, setNewFormCat] = useState<'ethics' | 'ip' | 'utilization'>('ethics')
  const [newFormUrl, setNewFormUrl] = useState('')

  const fetchDownloadableForms = async () => {
    try {
      const { data, error } = await supabase.from('downloadable_forms').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setDownloadableForms(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddDownloadableForm = async (e: React.FormEvent, urlOverride?: string) => {
    e.preventDefault()
    const fileUrl = urlOverride || newFormUrl
    if (!newFormTitle || !fileUrl) return
    try {
      const { error } = await supabase.from('downloadable_forms').insert({
        title: newFormTitle,
        category: newFormCat,
        file_url: fileUrl,
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
      },
    })
  }

  return {
    downloadableForms,
    newFormTitle,
    setNewFormTitle,
    newFormCat,
    setNewFormCat,
    newFormUrl,
    setNewFormUrl,
    fetchDownloadableForms,
    handleAddDownloadableForm,
    handleDeleteDownloadableForm,
  }
}

