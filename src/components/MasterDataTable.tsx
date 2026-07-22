import React from 'react'
import { Search } from 'lucide-react'
import { DataTable, DataTableColumn } from './DataTable'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export interface FilterField {
  key: string
  label: string
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
}

interface MasterDataTableProps<T> {
  // Header
  badge?: string
  title: string
  actionButton?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }

  // Search & Filters
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (val: string) => void
  filters?: FilterField[]

  // Table
  columns: DataTableColumn<T>[]
  data: T[]
  getRowKey: (item: T) => string
  loading?: boolean
  loadingLabel?: string
  empty: {
    icon: React.ReactNode
    title: string
    body?: string
    dashed?: boolean
  }
}

export function MasterDataTable<T>({
  badge,
  title,
  actionButton,
  searchPlaceholder = 'ค้นหา...',
  searchValue,
  onSearchChange,
  filters,
  columns,
  data,
  getRowKey,
  loading,
  loadingLabel,
  empty,
}: MasterDataTableProps<T>) {
  return (
    <div className="space-y-4">
      {/* Header and Action Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          {badge && (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#64748B' }}>
              {badge}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-slate-800">
              {title}
            </h3>
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0"
              style={{ background: '#F2F8F7', color: '#00796B', border: '1px solid #D1E5E3' }}
            >
              {data.length} รายการ
            </span>
          </div>
        </div>
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="w-full sm:w-auto h-9 px-4 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none shrink-0"
            style={{ background: 'linear-gradient(135deg, #00796B 0%, #00695C 100%)' }}
          >
            {actionButton.icon}
            {actionButton.label}
          </button>
        )}
      </div>

      {/* Search bar and Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-full light-input text-xs h-9"
          />
        </div>

        {/* Optional Filters */}
        {filters && filters.map((f) => (
          <div key={f.key} className="w-full sm:w-48 shrink-0">
            <Select
              value={f.value || '_all_'}
              onValueChange={(val) => f.onChange(val === '_all_' || !val ? '' : val)}
              items={[{ value: '_all_', label: `ทั้งหมด (${f.label})` }, ...f.options]}
            >
              <SelectTrigger className="w-full light-input text-xs h-9 flex items-center justify-between">
                <SelectValue placeholder={`ทั้งหมด (${f.label})`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_" className="font-medium">ทั้งหมด ({f.label})</SelectItem>
                {f.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* DataTable Wrapper */}
      <DataTable
        columns={columns}
        data={data}
        getRowKey={getRowKey}
        loading={loading}
        loadingLabel={loadingLabel}
        empty={empty}
        resetKey={searchValue}
      />
    </div>
  )
}
