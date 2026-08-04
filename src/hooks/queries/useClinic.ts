'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface ClinicEvent {
  id: string
  title: string
  description?: string
  event_date: string
  location?: string
  capacity?: number
  registered_count?: number
  user_registered?: boolean
}

export interface Appointment {
  id: string
  requester_id: string
  topic: string
  notes?: string
  requested_at: string
  status: string
  admin_notes?: string
  created_at: string
  profiles?: {
    email?: string
    role?: string
  }
}

export function useClinicInfo() {
  return useQuery({
    queryKey: ['clinic_info', 'description'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_info')
        .select('value')
        .eq('key', 'description')
        .maybeSingle()
      if (error) throw error
      return data?.value || ''
    },
  })
}

export function useClinicEvents(userId?: string) {
  return useQuery<ClinicEvent[]>({
    queryKey: ['clinic_events', userId || 'all'],
    queryFn: async () => {
      const { data: eventsData, error: eventsError } = await supabase
        .from('clinic_events')
        .select('*')
        .order('event_date', { ascending: true })
      if (eventsError) throw eventsError

      const events = eventsData || []
      const enriched = await Promise.all(
        events.map(async (ev) => {
          const { count } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', ev.id)

          let userReg = false
          if (userId) {
            const { data: regData } = await supabase
              .from('event_registrations')
              .select('id')
              .eq('event_id', ev.id)
              .eq('user_id', userId)
              .maybeSingle()
            userReg = !!regData
          }
          return {
            ...ev,
            registered_count: count || 0,
            user_registered: userReg,
          }
        })
      )
      return enriched
    },
  })
}

export function useAppointments(userId?: string) {
  return useQuery<Appointment[]>({
    queryKey: ['appointments', userId || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*, profiles:requester_id(email, role)')
        .order('requested_at', { ascending: false })

      if (userId) {
        query = query.eq('requester_id', userId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as Appointment[]
    },
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      requester_id,
      topic,
      notes,
      requested_at,
    }: {
      requester_id: string
      topic: string
      notes?: string
      requested_at: string
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          requester_id,
          topic: topic.trim(),
          notes: notes?.trim() || '',
          requested_at,
          status: 'pending',
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string
      status: string
      admin_notes?: string
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status, admin_notes })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useToggleEventRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      eventId,
      userId,
      isRegistered,
    }: {
      eventId: string
      userId: string
      isRegistered: boolean
    }) => {
      if (isRegistered) {
        const { error } = await supabase
          .from('event_registrations')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('event_registrations')
          .insert({ event_id: eventId, user_id: userId })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic_events'] })
    },
  })
}
