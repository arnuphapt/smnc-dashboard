import React from 'react'
import { Search, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterDropdownConfig {
  key: string
  placeholder: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
  className?: string
}

export type FilterBarSelect = FilterDropdownConfig

interface FilterBarProps {
  search?: string
  searchQuery?: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterDropdownConfig[]
  dropdowns?: FilterDropdownConfig[]
  onReset?: () => void
  resultCount?: number
  totalCount?: number
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'ค้นหาชื่อเรื่อง, คีย์เวิร์ด, ผู้แต่ง...',
  filters,
  dropdowns,
  onReset,
  resultCount,
  totalCount,
}) => {
  const query = search ?? searchQuery ?? ''
  const activeDropdowns = filters ?? dropdowns ?? []
  const displayCount = resultCount ?? totalCount

  const isFiltered = query !== '' || activeDropdowns.some((d) => d.value !== '' && d.value !== 'all')

  return (
    <div className="rounded-3xl p-5 shadow-flip-card bg-white border border-[#E2E8F0] space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search input with clean slate surface */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            type="text"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-11 pr-4 py-2.5 rounded-full text-xs font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#0F172A] transition shadow-xs"
          />
        </div>

        {/* Dynamic Dropdowns with Pill styling */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeDropdowns.map((d) => (
            <Select key={d.key} value={d.value} onValueChange={d.onChange}>
              <SelectTrigger className={`h-10 text-xs font-extrabold rounded-full px-4 border border-[#D1E5E3] bg-[#F2F8F7] text-[#0F172A] hover:bg-white hover:border-[#0F172A] transition shadow-xs min-w-[140px] ${d.className || ''}`}>
                <SelectValue placeholder={d.placeholder} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-xl">
                {d.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold focus:bg-[#F2F8F7] focus:text-[#0F172A]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {isFiltered && onReset && (
            <Button
              type="button"
              onClick={onReset}
              variant="outline"
              size="sm"
              className="h-10 rounded-full px-4 text-xs font-extrabold bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] hover:bg-[#E11D48] hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </div>

      {displayCount !== undefined && (
        <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
          <span>ผลการค้นหาข้อมูล</span>
          <span className="px-3.5 py-1 rounded-full font-mono bg-[#FFF8E7] text-[#D97706] border border-[#FCD34D] font-black text-xs shadow-xs">
            {displayCount} รายการ
          </span>
        </div>
      )}
    </div>
  )
}
