'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_TO_TABLE } from '@/utils/masterTables'

const supabase = createClient()

export interface MasterOption {
  id: string
  category: string
  value: string
  sort_order: number
}

// Backward compatibility type alias
export type LookupOption = MasterOption

interface MasterContextType {
  options: MasterOption[]
  loading: boolean
  getOptionsByCategory: (category: string) => MasterOption[]
  refreshOptions: () => Promise<void>
}

const MasterContext = createContext<MasterContextType | undefined>(undefined)

export const MasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<MasterOption[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOptions = async () => {
    try {
      const allOptions: MasterOption[] = []

      // Fetch from all 13 master tables in parallel
      const fetchPromises = Object.entries(CATEGORY_TO_TABLE).map(async ([category, table]) => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('sort_order', { ascending: true })

        if (!error && data) {
          return data.map((item: any) => ({
            id: String(item.id),
            category,
            value: String(item.name || item.value || item.label || item.year_be || item.id),
            sort_order: item.sort_order || 0,
          })) as MasterOption[]
        }
        return []
      })

      const results = await Promise.all(fetchPromises)
      results.forEach((opts) => allOptions.push(...opts))

      setOptions(allOptions)
    } catch (err) {
      console.error('Error fetching master options:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  const getOptionsByCategory = (category: string) => {
    return options.filter((opt) => opt.category === category)
  }

  return (
    <MasterContext.Provider value={{ options, loading, getOptionsByCategory, refreshOptions: fetchOptions }}>
      {children}
    </MasterContext.Provider>
  )
}

// Export MasterProvider alias for LookupProvider
export const LookupProvider = MasterProvider

export const useMasters = () => {
  const context = useContext(MasterContext)
  if (!context) {
    throw new Error('useMasters must be used within a MasterProvider')
  }
  return context
}

// Export useLookups alias for backwards compatibility
export const useLookups = useMasters
