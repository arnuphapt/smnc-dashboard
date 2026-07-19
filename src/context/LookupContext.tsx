import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

export interface LookupOption {
  id: string
  category: string
  value: string
  sort_order: number
}

interface LookupContextType {
  options: LookupOption[]
  loading: boolean
  getOptionsByCategory: (category: string) => LookupOption[]
  refreshOptions: () => Promise<void>
}

const LookupContext = createContext<LookupContextType | undefined>(undefined)

const INITIAL_ETHICS_CRITERIA = [
  '1. วัตถุประสงค์และการออกแบบการวิจัย',
  '2. ความเหมาะสมของระเบียบวิธีวิจัยและกลุ่มตัวอย่าง',
  '3. การปกป้องสิทธิ์ ความเป็นส่วนตัว และข้อมูลส่วนบุคคล',
  '4. ความสมบูรณ์ของแบบชี้แจงและใบยินยอม (Informed Consent)',
  '5. มาตรการป้องกันและลดความเสี่ยงต่ออาสาสมัคร',
  '6. สัดส่วนประโยชน์ที่ได้รับเทียบกับความเสี่ยงมีความเหมาะสม'
]

export const LookupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<LookupOption[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('lookup_options')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      let fetchedOptions = (data as LookupOption[]) || []

      const ethicsCriteria = fetchedOptions.filter(opt => opt.category === 'ethics_criteria')
      if (ethicsCriteria.length === 0) {
        const seedData = INITIAL_ETHICS_CRITERIA.map((val, idx) => ({
          category: 'ethics_criteria',
          value: val,
          sort_order: idx + 1
        }))
        const { data: insertedData, error: seedError } = await supabase
          .from('lookup_options')
          .insert(seedData)
          .select()
        if (!seedError && insertedData) {
          fetchedOptions = [...fetchedOptions, ...(insertedData as LookupOption[])]
        }
      }

      setOptions(fetchedOptions)
    } catch (err) {
      console.error('Error fetching lookup options:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOptions()

    // Subscribe to realtime changes on lookup_options
    const channel = supabase
      .channel('lookup-options-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lookup_options' },
        () => {
          fetchOptions() // Refetch everything to keep sort order and data in sync
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getOptionsByCategory = (category: string) => {
    return options.filter(opt => opt.category === category)
  }

  return (
    <LookupContext.Provider value={{ options, loading, getOptionsByCategory, refreshOptions: fetchOptions }}>
      {children}
    </LookupContext.Provider>
  )
}

export const useLookups = () => {
  const context = useContext(LookupContext)
  if (!context) {
    throw new Error('useLookups must be used within a LookupProvider')
  }
  return context
}
