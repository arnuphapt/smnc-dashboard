'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface DownloadableForm {
  id: string
  title: string
  file_url: string
  category: string
  sort_order?: number
}

export interface EthicsSubmission {
  id: string
  submitter_id: string
  project_title: string
  project_description?: string
  status: string
  assigned_reviewer_id?: string
  reviewer_notes?: string
  created_at: string
  profiles?: {
    email?: string
  }
}

export interface EthicsAttachment {
  id: string
  submission_id: string
  file_url: string
  file_name: string
  file_type?: string
  uploaded_at: string
}

export function useEthicsForms() {
  return useQuery<DownloadableForm[]>({
    queryKey: ['downloadable_forms', 'ethics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloadable_forms')
        .select('*')
        .eq('category', 'ethics')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data || []) as DownloadableForm[]
    },
  })
}

export function useEthicsSubmissions(userId?: string) {
  return useQuery<EthicsSubmission[]>({
    queryKey: ['ethics_submissions', userId || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('ethics_submissions')
        .select('*, profiles:submitter_id(email)')
        .order('created_at', { ascending: false })
      
      if (userId) {
        query = query.eq('submitter_id', userId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return (data || []) as EthicsSubmission[]
    },
  })
}

export function useEthicsAttachments() {
  return useQuery<EthicsAttachment[]>({
    queryKey: ['ethics_attachments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ethics_attachments')
        .select('*')
      if (error) throw error
      return (data || []) as EthicsAttachment[]
    },
  })
}

export function useSubmitEthics() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      submitter_id,
      project_title,
      project_description,
      files,
    }: {
      submitter_id: string
      project_title: string
      project_description?: string
      files?: FileList | null
    }) => {
      const { data: subData, error: subError } = await supabase
        .from('ethics_submissions')
        .insert({
          submitter_id,
          project_title: project_title.trim(),
          project_description: project_description?.trim() || '',
          status: 'ยื่นแล้ว',
        })
        .select()
        .single()

      if (subError) throw subError
      const submissionId = subData.id

      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const extIndex = file.name.lastIndexOf('.')
          const ext = extIndex !== -1 ? file.name.substring(extIndex) : ''
          const base = extIndex !== -1 ? file.name.substring(0, extIndex) : file.name
          const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, '_')
          const safeName = /[a-zA-Z0-9]/.test(sanitizedBase) ? sanitizedBase : 'doc'
          const storagePath = `ethics/${submitter_id}/${Date.now()}_${safeName}${ext}`

          const { error: uploadError } = await supabase.storage
            .from('wisdom-private')
            .upload(storagePath, file)
          if (uploadError) throw uploadError

          const { error: attachError } = await supabase.from('ethics_attachments').insert({
            submission_id: submissionId,
            file_url: storagePath,
            file_name: file.name,
            file_type: file.type,
          })
          if (attachError) throw attachError
        }
      }
      return subData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
      queryClient.invalidateQueries({ queryKey: ['ethics_attachments'] })
    },
  })
}

export function useUpdateEthicsStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewer_notes,
      assigned_reviewer_id,
    }: {
      id: string
      status?: string
      reviewer_notes?: string
      assigned_reviewer_id?: string
    }) => {
      const updatePayload: Record<string, any> = {}
      if (status !== undefined) updatePayload.status = status
      if (reviewer_notes !== undefined) updatePayload.reviewer_notes = reviewer_notes
      if (assigned_reviewer_id !== undefined) updatePayload.assigned_reviewer_id = assigned_reviewer_id

      const { data, error } = await supabase
        .from('ethics_submissions')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ethics_submissions'] })
    },
  })
}
