import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// One table shell for every admin list (items, lookups, users, appointments,
// ethics submissions, IP applications) — same header/row treatment everywhere,
// and paginates itself once a list passes 10 rows instead of dumping an
// unbounded table onto the page.
export interface DataTableColumn<T> {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
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

  const start = (page - 1) * pageSize
  const pageRows = data.slice(start, start + pageSize)

  const headerRowStyle = headerVariant === 'navy'
    ? { background: '#0F172A', color: '#FFFFFF' }
    : { background: '#F2F8F7', borderBottom: '1px solid #CBD5E1', color: '#0F172A' }

  return (
    <div className="rounded-3xl overflow-hidden shadow-flip-card bg-white border border-[#E2E8F0]">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-transparent" style={headerRowStyle}>
            <TableHead
              className="h-auto whitespace-normal p-4 font-mono font-black uppercase text-[11px] tracking-widest text-center w-12 text-[#0F172A]"
            >
              ลำดับ
            </TableHead>
            {columns.map((col) => {
              const isSorted = col.sortable && sortField === col.key
              return (
                <TableHead
                  key={col.key}
                  onClick={col.sortable ? () => onSortChange?.(col.key) : undefined}
                  className={`h-auto whitespace-normal p-4 font-mono font-black uppercase text-[11px] tracking-widest text-[#0F172A] ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''} ${col.sortable ? 'cursor-pointer select-none' : ''}`}
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
                  <div className="text-[#94A3B8]">
                    {empty.icon}
                  </div>
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
                {columns.map((col) => (
                  <TableCell key={col.key} className={`whitespace-normal p-4 text-[#0F172A] ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {data.length > pageSize && (
        <div
          className="flex items-center justify-between px-5 py-3 border-t border-[#E2F1F0] bg-[#F4FAF9]"
        >
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
  )
}
