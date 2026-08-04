'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { WisdomItem } from '@/components/views/Dashboard'

const supabase = createClient()

export function useWisdomItems(category?: string) {
  return useQuery<WisdomItem[]>({
    queryKey: ['wisdom_items', category || 'all'],
    queryFn: async () => {
      let query = supabase.from('wisdom_items').select('*').order('created_at', { ascending: false })
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }
      const { data, error } = await query
      if (error) throw error
      return (data || []) as WisdomItem[]
    },
  })
}

export function useCreateWisdomItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (newItem: Partial<WisdomItem>) => {
      const { data, error } = await supabase.from('wisdom_items').insert(newItem).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wisdom_items'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateWisdomItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updatedFields }: Partial<WisdomItem> & { id: string }) => {
      const { data, error } = await supabase.from('wisdom_items').update(updatedFields).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wisdom_items'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteWisdomItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wisdom_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wisdom_items'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
