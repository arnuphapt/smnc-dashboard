'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseMasterdataClinicParams {
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

export function useMasterdataClinic({ triggerConfirm, triggerAlert }: UseMasterdataClinicParams) {
  const supabase = createClient()

  const [appointments, setAppointments] = useState<any[]>([])
  const [clinicEvents, setClinicEvents] = useState<any[]>([])
  const [clinicDesc, setClinicDesc] = useState('')

  // Phase 2 Form & Action States
  const [newEvTitle, setNewEvTitle] = useState('')
  const [newEvDesc, setNewEvDesc] = useState('')
  const [newEvDate, setNewEvDate] = useState('')
  const [newEvLoc, setNewEvLoc] = useState('')
  const [newEvCap, setNewEvCap] = useState('')

  const [appEditing, setAppEditing] = useState<any | null>(null)
  const [appNotesInput, setAppNotesInput] = useState('')
  const [appStatusInput, setAppStatusInput] = useState('pending')

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('requested_at', { ascending: false })
      if (error) throw error
      setAppointments(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchClinicEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_events')
        .select('*')
        .order('event_date', { ascending: true })
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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvTitle || !newEvDate) return
    try {
      const { error } = await supabase.from('clinic_events').insert({
        title: newEvTitle,
        description: newEvDesc,
        event_date: new Date(newEvDate).toISOString(),
        location: newEvLoc,
        capacity: newEvCap ? parseInt(newEvCap) : null,
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
      },
    })
  }

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

  return {
    appointments,
    clinicEvents,
    clinicDesc,
    setClinicDesc,
    newEvTitle,
    setNewEvTitle,
    newEvDesc,
    setNewEvDesc,
    newEvDate,
    setNewEvDate,
    newEvLoc,
    setNewEvLoc,
    newEvCap,
    setNewEvCap,
    appEditing,
    setAppEditing,
    appNotesInput,
    setAppNotesInput,
    appStatusInput,
    setAppStatusInput,
    fetchAppointments,
    fetchClinicEvents,
    fetchClinicDesc,
    handleUpdateClinicDesc,
    handleAddEvent,
    handleDeleteEvent,
    handleUpdateAppStatus,
  }
}

