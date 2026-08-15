import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ContentPanel } from './PageHeader'

export interface StatCardItem {
  key: string
  count: number | string
  label: string
  icon?: React.ReactNode
  iconBg?: string
  iconColor?: string
}

export interface TabItem {
  id: string
  label: string
  count?: number
}

export interface FilterField {
  key: string
  label: string
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
}

export interface DataTableColumn<T> {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render: (row: T) => React.ReactNode
  className?: string
  headerClassName?: string
}

export interface DataTableProps<T> {
  // 1. Summary Stat Cards (Optional)
  summaryCards?: StatCardItem[]

  // 2. Filter Tab Pills (Optional)
  tabs?: TabItem[]
  activeTab?: string
  onTabChange?: (tabId: string) => void

  // 3. Header & Action Button (Optional)
  eyebrow?: string
  badge?: string
  title?: string
  subtitle?: string
  actionButton?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }

  // 4. Search & Dropdown Filters (Optional)
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (val: string) => void
  filters?: FilterField[]

  // 5. Core Table Props
  columns: DataTableColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  pageSize?: number
  loading?: boolean
  loadingLabel?: string
  empty: { icon: React.ReactNode; title: string; body?: string; dashed?: boolean }
  resetKey?: unknown
  headerVariant?: 'frost' | 'navy'
  sortField?: string
  sortAsc?: boolean
  onSortChange?: (key: string) => void
  asPanel?: boolean
}

export function DataTable<T>({
  summaryCards,
  tabs,
  activeTab,
  onTabChange,
  eyebrow,
  badge,
  title,
  subtitle,
  actionButton,
  searchPlaceholder = 'ค้นหา...',
  searchValue,
  onSearchChange,
  filters,
  columns,
  data,
  getRowKey,
  pageSize = 10,
  loading,
  loadingLabel = 'กำลังโหลดข้อมูล...',
  empty,
  resetKey,
  headerVariant = 'frost',
  sortField,
  sortAsc,
  onSortChange,
  asPanel,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  useEffect(() => {
    setPage(1)
  }, [resetKey, searchValue])

  const start = (page - 1) * pageSize
  const pageRows = data.slice(start, start + pageSize)

  const headerRowStyle = headerVariant === 'navy'
    ? { background: '#0F172A', color: '#FFFFFF' }
    : { background: '#F2F8F7', borderBottom: '1px solid #CBD5E1', color: '#0F172A' }

  // Decide if we should render header, search, or filters section
  const hasHeader = Boolean(title || eyebrow || badge || actionButton)
  const hasControls = Boolean(onSearchChange !== undefined || (filters && filters.length > 0))
  const shouldWrapPanel = asPanel !== undefined ? asPanel : hasHeader

  const mainTableElement = (
    <div className="space-y-4">
      {/* Header with Title, Badge, Count, and Action Button */}
      {hasHeader && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div>
            {(eyebrow || badge) && (
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1 text-[#00796B]">
                {eyebrow || badge}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {title && (
                <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
                  {title}
                </h3>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 bg-[#F2F8F7] text-[#00796B] border border-[#D1E5E3]">
                {data.length} รายการ
              </span>
            </div>
            {subtitle && <p className="text-xs text-[#64748B] font-medium mt-0.5">{subtitle}</p>}
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
      )}

      {/* Search Bar & Dropdown Filters Row */}
      {hasControls && (
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
          {onSearchChange !== undefined && (
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-full light-input text-xs h-9.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white"
              />
            </div>
          )}

          {filters && filters.map((f) => (
            <div key={f.key} className="w-full sm:w-48 shrink-0">
              <Select
                value={f.value || '_all_'}
                onValueChange={(val) => f.onChange(val === '_all_' || !val ? '' : val)}
                items={[{ value: '_all_', label: `ทั้งหมด (${f.label})` }, ...f.options]}
              >
                <SelectTrigger className="w-full light-input text-xs h-9.5 rounded-full flex items-center justify-between">
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
      )}

      {/* Table Loading State */}
      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3">
          <div className="spinner-teal"></div>
          <p className="text-xs font-semibold text-[#94A3B8]">{loadingLabel}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-3xl overflow-hidden shadow-flip-card bg-white border border-[#E2E8F0]">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="border-b-0 hover:bg-transparent" style={headerRowStyle}>
                  <TableHead className="h-auto whitespace-normal p-4 font-mono font-black uppercase text-[11px] tracking-widest text-center w-12 text-[#0F172A]">
                    ลำดับ
                  </TableHead>
                  {columns.map((col) => {
                    const isSorted = col.sortable && sortField === col.key
                    const isActionsCol = col.key === 'จัดการ' || col.key === 'actions' || col.header === 'จัดการ'
                    const effectiveAlign = col.align || (isActionsCol ? 'center' : 'left')
                    const alignClass = effectiveAlign === 'center' ? 'text-center' : effectiveAlign === 'right' ? 'text-right' : 'text-left'

                    return (
                      <TableHead
                        key={col.key}
                        onClick={col.sortable ? () => onSortChange?.(col.key) : undefined}
                        className={`h-auto whitespace-normal p-4 font-mono font-black uppercase text-[11px] tracking-widest text-[#0F172A] ${alignClass} ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                      >
                        {col.header}
                        {col.sortable && (
                          <span className="ml-1 font-mono text-[#00796B]">
                            {isSorted ? (sortAsc ? '▲' : '▼') : '⇅'}
                          </span>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:last-child]:border-0 divide-y divide-[#E2E8F0]">
                {data.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={columns.length + 1} className="text-center py-14 text-[#94A3B8]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="text-[#94A3B8]">{empty.icon}</div>
                        <p className="font-extrabold text-xs text-[#0F172A]">{empty.title}</p>
                        {empty.body && <p className="text-[11px] text-[#64748B] font-medium">{empty.body}</p>}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row, idx) => (
                    <TableRow key={getRowKey(row)} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <TableCell className="whitespace-normal p-4 text-center font-mono font-bold text-[#64748B]">
                        {start + idx + 1}
                      </TableCell>
                      {columns.map((col) => {
                        const isActionsCol = col.key === 'จัดการ' || col.key === 'actions' || col.header === 'จัดการ'
                        const effectiveAlign = col.align || (isActionsCol ? 'center' : 'left')
                        const alignClass = effectiveAlign === 'center' ? 'text-center' : effectiveAlign === 'right' ? 'text-right' : 'text-left'

                        return (
                          <TableCell key={col.key} className={`whitespace-normal p-4 text-[#0F172A] ${alignClass}`}>
                            {col.render(row)}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {data.length > pageSize && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2F1F0] bg-[#F4FAF9]">
                <p className="text-[10px] font-mono font-bold text-[#6BAAA6]">
                  แสดง {start + 1}–{Math.min(start + pageSize, data.length)} จาก {data.length} รายการ
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    aria-label="หน้าก่อนหน้า"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full bg-[#E8F6F5] text-[#2BA8A2] hover:bg-[#2BA8A2] hover:text-white transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-[10px] font-mono font-black px-2 text-[#1E8C86]">
                    หน้า {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    aria-label="หน้าถัดไป"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full bg-[#E8F6F5] text-[#2BA8A2] hover:bg-[#2BA8A2] hover:text-white transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-3">
            {data.length === 0 ? (
              <div className="rounded-3xl p-8 bg-white border border-[#E2E8F0] shadow-xs text-center text-[#94A3B8]">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-[#94A3B8]">{empty.icon}</div>
                  <p className="font-extrabold text-xs text-[#0F172A]">{empty.title}</p>
                  {empty.body && <p className="text-[11px] text-[#64748B] font-medium">{empty.body}</p>}
                </div>
              </div>
            ) : (
              pageRows.map((row, idx) => {
                const actionCol = columns.find(
                  (c) => c.key === 'actions' || c.key === 'จัดการ' || c.header === 'จัดการ'
                )
                const contentCols = columns.filter(
                  (c) => c.key !== 'actions' && c.key !== 'จัดการ' && c.header !== 'จัดการ'
                )

                return (
                  <div
                    key={getRowKey(row)}
                    className="rounded-3xl p-4 bg-white border border-[#E2E8F0] shadow-flip-card space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                      <span className="text-[10px] font-mono font-black text-[#00796B] bg-[#F0F7FF] px-2.5 py-0.5 rounded-full border border-[#DAEEFF]">
                        รายการที่ #{start + idx + 1}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {contentCols.map((col) => (
                        <div key={col.key} className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-mono font-black uppercase text-[#64748B] tracking-wider">
                            {col.header}
                          </span>
                          <div className="text-[#0F172A] font-semibold">{col.render(row)}</div>
                        </div>
                      ))}
                    </div>

                    {actionCol && (
                      <div className="pt-2.5 border-t border-[#F1F5F9] flex items-center justify-end gap-2 flex-wrap">
                        {actionCol.render(row)}
                      </div>
                    )}
                  </div>
                )
              })
            )}

            {/* Mobile Pagination Controls */}
            {data.length > pageSize && (
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
                <p className="text-[10px] font-mono font-bold text-[#64748B]">
                  {start + 1}–{Math.min(start + pageSize, data.length)} จาก {data.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    aria-label="หน้าก่อนหน้า"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full bg-[#F0F7FF] text-[#00796B] border border-[#DAEEFF] hover:bg-[#00796B] hover:text-white transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-[10px] font-mono font-black px-2 text-[#0F172A]">
                    {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    aria-label="หน้าถัดไป"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full bg-[#F0F7FF] text-[#00796B] border border-[#DAEEFF] hover:bg-[#00796B] hover:text-white transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* 1. Summary Stat Cards */}
      {summaryCards && summaryCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <div
              key={card.key}
              className="p-4 rounded-3xl bg-white border border-[#E2E8F0] shadow-flip-card flex items-center gap-3"
            >
              {card.icon && (
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center ${card.iconBg || 'bg-[#F1F5F9]'
                    } ${card.iconColor || 'text-[#475569]'} shrink-0`}
                >
                  {card.icon}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-2xl font-black text-[#0F172A] block leading-none">
                  {card.count}
                </span>
                <span className="text-[10px] font-extrabold text-[#64748B] uppercase block mt-1 truncate">
                  {card.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Filter Tab Pills */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-[#00796B] text-white shadow-md shadow-[#00796B]/20'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                }`}
            >
              {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
            </button>
          ))}
        </div>
      )}

      {/* 3. Main Table Panel or Direct View */}
      {shouldWrapPanel ? <ContentPanel>{mainTableElement}</ContentPanel> : mainTableElement}
    </div>
  )
}
