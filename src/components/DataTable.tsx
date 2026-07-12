import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// One table shell for every admin list (items, lookups, users, appointments,
// ethics submissions, IP applications) — same header/row treatment everywhere,
// and paginates itself once a list passes 10 rows instead of dumping an
// unbounded table onto the page.
export interface DataTableColumn<T> {
  key: string
  header: string
  align?: 'left' | 'center'
  sortable?: boolean
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  pageSize?: number
  loading?: boolean
  loadingLabel?: string
  empty: { icon: React.ReactNode; title: string; body?: string; dashed?: boolean }
  resetKey?: unknown
  /** 'frost' (default) matches the admin console; 'navy' matches the public Repositories header. */
  headerVariant?: 'frost' | 'navy'
  sortField?: string
  sortAsc?: boolean
  onSortChange?: (key: string) => void
}

export function DataTable<T>({
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
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))

  // Snap back to a valid page if the list shrank (e.g. a delete emptied the
  // last page) — but don't fight the user by resetting on every live update.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  // Caller-driven reset (e.g. the search box changed) always jumps to page 1.
  useEffect(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center gap-3">
        <div className="spinner-teal"></div>
        <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{loadingLabel}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return <EmptyState {...empty} />
  }

  const start = (page - 1) * pageSize
  const pageRows = data.slice(start, start + pageSize)

  const headerRowStyle = headerVariant === 'navy'
    ? { background: '#0B1D3A' }
    : { background: '#F0F7FF', borderBottom: '1px solid #DAEEFF' }
  const headerTextColor = headerVariant === 'navy' ? '#FFFFFF' : '#64748B'

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-transparent" style={headerRowStyle}>
            {columns.map((col) => {
              const isSorted = col.sortable && sortField === col.key
              return (
                <TableHead
                  key={col.key}
                  onClick={col.sortable ? () => onSortChange?.(col.key) : undefined}
                  className={`h-auto whitespace-normal p-4 font-extrabold uppercase text-[10px] tracking-wider ${col.align === 'center' ? 'text-center' : ''} ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                  style={{ color: headerTextColor }}
                >
                  {col.header}
                  {col.sortable && (
                    <span className={`ml-1 font-mono ${headerVariant === 'navy' && !isSorted ? 'text-white/50' : ''}`} style={headerVariant !== 'navy' ? { color: '#94A3B8' } : undefined}>
                      {isSorted ? (sortAsc ? '▲' : '▼') : '⇅'}
                    </span>
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-0">
          {pageRows.map((row) => (
            <TableRow key={getRowKey(row)} className="border-b hover:bg-slate-50/60" style={{ borderColor: '#F1F5F9' }}>
              {columns.map((col) => (
                <TableCell key={col.key} className={`whitespace-normal p-4 ${col.align === 'center' ? 'text-center' : ''}`}>
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.length > pageSize && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: '1px solid #F1F5F9', background: '#FAFCFF' }}
        >
          <p className="text-[10px] font-semibold" style={{ color: '#94A3B8' }}>
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
              className="rounded-lg"
              style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0' }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] font-bold px-1.5" style={{ color: '#0B1D3A' }}>
              หน้า {page} / {totalPages}
            </span>
            <Button
              type="button"
              aria-label="หน้าถัดไป"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              size="icon-sm"
              variant="ghost"
              className="rounded-lg"
              style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0' }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
