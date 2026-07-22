'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface MasterOption {
  id: string
  name?: string
  label?: string
  value?: string
  year_be?: number
  sort_order?: number
}

export function useMasterTable(tableName: string) {
  return useQuery({
    queryKey: ['master_table', tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error(`Error fetching ${tableName}:`, error)
        throw error
      }
      return data || []
    },
  })
}

export function useMasterDepartments() {
  return useMasterTable('master_departments')
}

export function useMasterYears() {
  return useMasterTable('master_years')
}

export function useMasterResearchTypes() {
  return useMasterTable('master_research_types')
}

export function useMasterJournalRanks() {
  return useMasterTable('master_journal_ranks')
}

export function useMasterScopes() {
  return useMasterTable('master_scopes')
}

export function useMasterVenues() {
  return useMasterTable('master_venues')
}

export function useMasterSources() {
  return useMasterTable('master_sources')
}

export function useMasterInnovationTypes() {
  return useMasterTable('master_innovation_types')
}

export function useMasterIpTypes() {
  return useMasterTable('master_ip_types')
}

export function useMasterIpStatuses() {
  return useMasterTable('master_ip_statuses')
}

export function useMasterAwardLevels() {
  return useMasterTable('master_award_levels')
}

export function useMasterUtilizationTypes() {
  return useMasterTable('master_utilization_types')
}

export function useMasterEthicsCriteria() {
  return useMasterTable('master_ethics_criteria')
}
