'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/context/AuthContext'

const supabase = createClient()

export function useProfiles() {
  const queryClient = useQueryClient()
  const query = useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as Profile[]
    },
  })

  return {
    ...query,
    profiles: query.data || [],
    refetchProfiles: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  }
}
