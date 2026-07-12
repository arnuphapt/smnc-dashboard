import React from 'react'
import { Search, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const ALL_VALUE = '__all__'

export interface FilterBarSelect {
  key: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { value: string; label: string }[]
  className?: string
}

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters: FilterBarSelect[]
  onReset: () => void
  resultCount: number
  totalCount: number
}

// One search-bar-plus-dropdown-filters shell for every "browse a list" page —
// Repositories' 5 categories all render this same row, only the dropdown set
// changes per category. Empty string means "no filter" everywhere in this app,
// but shadcn's Select can't hold an empty-string item value, so ALL_VALUE is
// the internal placeholder sentinel translated back to '' at the boundary.
export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = 'ค้นหา...',
  filters,
  onReset,
  resultCount,
  totalCount,
}) => (
  <div className="content-panel p-4 flex flex-wrap gap-3 items-center justify-between">
    <div className="flex flex-wrap gap-3 items-center flex-grow">
      {/* Search */}
      <div className="relative min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: '#94A3B8' }} />
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-1.5 h-auto rounded-xl text-xs light-input"
        />
      </div>

      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={filter.value || ALL_VALUE}
          onValueChange={(v) => filter.onChange(v === ALL_VALUE ? '' : (v ?? ''))}
          items={[{ value: ALL_VALUE, label: filter.placeholder }, ...filter.options]}
        >
          <SelectTrigger className={`py-1.5 h-auto rounded-xl text-xs light-input ${filter.className || ''}`}>
            <SelectValue placeholder={filter.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{filter.placeholder}</SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Reset button */}
      <Button
        onClick={onReset}
        variant="ghost"
        className="p-1.5 h-auto rounded-xl text-xs font-bold flex items-center gap-1 hover:-translate-y-0.5"
        style={{ background: '#F0F7FF', color: '#0B1D3A', border: '1px solid #DAEEFF' }}
        title="ล้างตัวกรอง"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        รีเซ็ต
      </Button>
    </div>

    {/* Counts */}
    <div className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.2)' }}>
      แสดง {resultCount} / {totalCount} รายการ
    </div>
  </div>
)
