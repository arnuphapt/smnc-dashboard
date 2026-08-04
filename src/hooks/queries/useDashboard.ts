'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { WisdomItem } from '@/components/views/Dashboard'
import { DownloadableForm } from './useEthics'

const supabase = createClient()

export interface DashboardData {
  items: WisdomItem[]
  forms: DownloadableForm[]
  stats: {
    research: number
    intellectual_property: number
    innovation: number
    petty_patent: number
    copyright: number
    award: number
    utilization: number
  }
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [itemsRes, formsRes] = await Promise.all([
        supabase.from('wisdom_items').select('*').order('created_at', { ascending: false }),
        supabase.from('downloadable_forms').select('*').order('sort_order', { ascending: true }),
      ])

      if (itemsRes.error) throw itemsRes.error
      if (formsRes.error) throw formsRes.error

      const items = (itemsRes.data || []) as WisdomItem[]
      const forms = (formsRes.data || []) as DownloadableForm[]

      const counts = {
        research: 0,
        intellectual_property: 0,
        innovation: 0,
        petty_patent: 0,
        copyright: 0,
        award: 0,
        utilization: 0,
      }

      items.forEach((item) => {
        const cat = item.category
        if (cat in counts) {
          counts[cat as keyof typeof counts]++
        }
        if (cat === 'intellectual_property' && item.metadata?.subtype) {
          const sub = String(item.metadata.subtype).toLowerCase()
          if (sub.includes('อนุสิทธิบัตร')) counts.petty_patent++
          else if (sub.includes('ลิขสิทธิ์')) counts.copyright++
        }
      })

      return {
        items,
        forms,
        stats: counts,
      }
    },
  })
}
