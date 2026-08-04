'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { DownloadableForm } from './useEthics'

const supabase = createClient()

export interface IPApplication {
  id: string
  applicant_id: string
  ip_type: string
  title_th: string
  title_en?: string
  status: string
  req_number?: string
  step?: string
  admin_notes?: string
  created_at: string
  profiles?: {
    email?: string
  }
}

export function useIPForms() {
  return useQuery<DownloadableForm[]>({
    queryKey: ['downloadable_forms', 'ip'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloadable_forms')
        .select('*')
        .eq('category', 'ip')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data || []) as DownloadableForm[]
    },
  })
}

export function useIPApplications(userId?: string) {
  return useQuery<IPApplication[]>({
    queryKey: ['ip_applications', userId || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('ip_applications')
        .select('*, profiles:applicant_id(email)')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('applicant_id', userId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as IPApplication[]
    },
  })
}

export function useUpdateIPStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      req_number,
      step,
      admin_notes,
    }: {
      id: string
      status?: string
      req_number?: string
      step?: string
      admin_notes?: string
    }) => {
      const updatePayload: Record<string, any> = {}
      if (status !== undefined) updatePayload.status = status
      if (req_number !== undefined) updatePayload.req_number = req_number
      if (step !== undefined) updatePayload.step = step
      if (admin_notes !== undefined) updatePayload.admin_notes = admin_notes

      const { data, error } = await supabase
        .from('ip_applications')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip_applications'] })
    },
  })
}
