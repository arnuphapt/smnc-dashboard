'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/context/AuthContext'

interface UseMasterdataIPParams {
  profiles: Profile[]
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

export function useMasterdataIP({ profiles, triggerConfirm, triggerAlert }: UseMasterdataIPParams) {
  const supabase = createClient()

  const [ipApplications, setIpApplications] = useState<any[]>([])
  const [ipEditing, setIpEditing] = useState<any | null>(null)
  const [ipReqNumInput, setIpReqNumInput] = useState('')
  const [ipStepInput, setIpStepInput] = useState('')
  const [ipNotesInput, setIpNotesInput] = useState('')
  const [ipStatusInput, setIpStatusInput] = useState('ยื่นคำขอ')

  const fetchIpApplications = async () => {
    try {
      const { data, error } = await supabase.from('ip_applications').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setIpApplications(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateIPApp = async (ipId: string, status: string, step: string, notes: string, reqNum: string) => {
    try {
      const { error } = await supabase
        .from('ip_applications')
        .update({
          status,
          current_step: step,
          admin_notes: notes,
          request_number: reqNum,
        })
        .eq('id', ipId)
      if (error) throw error
      setIpEditing(null)
      fetchIpApplications()
      triggerAlert('สำเร็จ', 'อัปเดตคำขอทรัพย์สินทางปัญญาเรียบร้อยแล้ว!', 'primary')
    } catch (err: any) {
      triggerAlert('เกิดข้อผิดพลาด', `ไม่สามารถอัปเดตข้อมูลทรัพย์สินทางปัญญาได้: ${err.message}`, 'danger')
    }
  }

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
        const applicantEmail = profiles.find((p) => p.id === app.applicant_id)?.email || 'คณาจารย์'

        const { error: insertError } = await supabase.from('wisdom_items').insert({
          category: 'intellectual_property',
          title: app.title,
          description: `โอนย้ายจากใบสมัครยื่นขอจดทะเบียนผลงานของ ${applicantEmail}. ${app.admin_notes || ''}`,
          authors: applicantEmail,
          is_public: true,
          metadata: {
            ip_type: app.ip_type,
            registration_number: app.request_number,
            registration_date: new Date().toLocaleDateString('th-TH'),
          },
        })
        if (insertError) throw insertError

        const { error: updateError } = await supabase
          .from('ip_applications')
          .update({
            transferred_to_catalog: true,
            status: 'อนุมัติ',
          })
          .eq('id', app.id)
        if (updateError) throw updateError

        triggerAlert('สำเร็จ', 'โอนย้ายผลงานเข้าสู่คลังทรัพย์สินทางปัญญาหลักเรียบร้อยแล้ว!', 'primary')
        fetchIpApplications()
      },
    })
  }

  return {
    ipApplications,
    ipEditing,
    setIpEditing,
    ipReqNumInput,
    setIpReqNumInput,
    ipStepInput,
    setIpStepInput,
    ipNotesInput,
    setIpNotesInput,
    ipStatusInput,
    setIpStatusInput,
    fetchIpApplications,
    handleUpdateIPApp,
    handleTransferToCatalog,
  }
}

