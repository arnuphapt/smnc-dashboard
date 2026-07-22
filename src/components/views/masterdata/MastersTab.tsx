'use client'

import React, { useState } from 'react'
import { Trash2, Settings, Plus, Edit2 } from 'lucide-react'
import { DataTableColumn } from '@/components/DataTable'
import { MasterDataTable } from '@/components/MasterDataTable'
import { MasterOption } from '@/context/MasterContext'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase } from '@/services/supabase'
import { getTableForCategory } from '@/utils/masterTables'

const LOOKUP_CATEGORY_OPTIONS = [
  { value: 'research_type', label: 'ประเภทผู้สร้างสรรค์' },
  { value: 'department', label: 'สาขาวิชา/หน่วยงาน' },
  { value: 'ip_type', label: 'ประเภททรัพย์สินทางปัญญา' },
  { value: 'award_level', label: 'ระดับรางวัลเชิดชูเกียรติ' },
  { value: 'utilization_type', label: 'ประเภทการนำไปใช้ประโยชน์' },
  { value: 'journal_rank', label: 'ระดับฐานวารสาร' },
  { value: 'scope', label: 'ขอบเขตผลงาน' },
  { value: 'innovation_type', label: 'ประเภทของผลนวัตกรรม' },
  { value: 'source', label: 'ที่มาของชิ้นงาน' },
  { value: 'ip_current_status', label: 'สถานะปัจจุบัน IP' },
  { value: 'venue', label: 'เวทีการนำเสนอ' },
  { value: 'year', label: 'ปี' },
  { value: 'ethics_criteria', label: 'เกณฑ์การพิจารณาจริยธรรม' },
]

interface MastersTabProps {
  options: MasterOption[]
  lookupCategory: string
  setLookupCategory: (value: string) => void
  lookupValue: string
  setLookupValue: (value: string) => void
  onAddLookup: (e: React.FormEvent) => void
  onDeleteLookup: (id: string) => void
  defaultCategory?: string
}

export const MastersTab: React.FC<MastersTabProps> = ({
  options,
  lookupCategory,
  setLookupCategory,
  lookupValue,
  setLookupValue,
  onAddLookup,
  onDeleteLookup,
  defaultCategory = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingLookup, setEditingLookup] = useState<MasterOption | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editCategory, setEditCategory] = useState('')

  // Sync when navigating between lookup category pages
  React.useEffect(() => {
    setSelectedCategory(defaultCategory)
    if (defaultCategory) setLookupCategory(defaultCategory)
  }, [defaultCategory])

  const columns: DataTableColumn<MasterOption>[] = [
    // The category column is only useful on the "all lookups" overview — on a
    // locked single-category page every row would repeat the same value.
    ...(defaultCategory ? [] : [
      { key: 'category', header: 'หมวดหมู่', render: (opt: MasterOption) => <span className="text-slate-500 font-semibold">{opt.category}</span> } as DataTableColumn<MasterOption>,
    ]),
    { key: 'value', header: 'ชื่อ', render: (opt) => <span className="font-bold" style={{ color: '#0B1D3A' }}>{opt.value}</span> },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (opt) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setEditingLookup(opt)
              setEditValue(opt.value)
              setEditCategory(opt.category)
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#F0F7FF', color: '#00796B', borderColor: '#DAEEFF' }}
          >
            <Edit2 className="w-3 h-3" />
            แก้ไข
          </button>
          <button
            onClick={() => onDeleteLookup(opt.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#FFF1F2', color: '#9F1239', borderColor: '#FECDD3' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            ลบ
          </button>
        </div>
      ),
    },
  ]

  const filteredOptions = options.filter((opt) => {
    const matchesSearch = !searchQuery.trim() ||
      opt.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.value.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !selectedCategory || opt.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-4">
      <MasterDataTable
        badge="Master Data"
        title={defaultCategory
          ? (LOOKUP_CATEGORY_OPTIONS.find(o => o.value === defaultCategory)?.label ?? defaultCategory)
          : 'ตัวเลือกตัวกรองปัจจุบันทั้งหมด'
        }
        actionButton={{
          label: 'เพิ่มตัวเลือก',
          onClick: () => setIsAddOpen(true),
          icon: <Plus className="w-4 h-4" />
        }}
        searchPlaceholder="ค้นหาตัวเลือก..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={!defaultCategory ? [
          {
            key: 'category',
            label: 'หมวดหมู่ตัวกรอง',
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: LOOKUP_CATEGORY_OPTIONS
          }
        ] : undefined}
        columns={columns}
        data={filteredOptions}
        getRowKey={(opt) => opt.id}
        empty={{
          icon: <Settings className="w-9 h-9 stroke-[1.5]" />,
          title: 'ยังไม่มีตัวกรองเพิ่มเติมในระบบ',
          body: 'เพิ่มตัวเลือกจากฟอร์มด้านบนเพื่อให้เลือกได้ในฟอร์มบันทึกผลงาน',
          dashed: true
        }}
      />

      {/* Add dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-[480px] w-full p-6 space-y-4 rounded-2xl shadow-2xl border border-slate-200 animate-fadeIn">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#64748B' }}>คลังข้อมูล</p>
            <DialogTitle className="text-sm font-black text-slate-900 leading-snug">
              เพิ่มตัวเลือกตัวกรองใหม่
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              กรอกข้อมูลเพื่อระบุประเภทคัดกรองผลงานวิจัยหรือนวัตกรรม
            </DialogDescription>
          </div>

          <form
            onSubmit={(e) => {
              onAddLookup(e)
              setIsAddOpen(false)
            }}
            className="space-y-4 text-xs"
          >
            {!defaultCategory && (
              <div>
                <label className="block text-slate-500 font-bold mb-1">หมวดหมู่ตัวกรอง (Category)</label>
                <Select value={lookupCategory} onValueChange={(v) => setLookupCategory(v ?? '')} items={LOOKUP_CATEGORY_OPTIONS}>
                  <SelectTrigger className="w-full light-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOOKUP_CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-slate-500 font-bold mb-1">ชื่อ</label>
              <Input
                type="text"
                required
                value={lookupValue}
                onChange={(e) => setLookupValue(e.target.value)}
                placeholder="เช่น Routine to Research (R2R)"
                className="w-full light-input"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none"
                style={{ background: 'linear-gradient(135deg, #00796B 0%, #00695C 100%)' }}
              >
                บันทึกตัวเลือก
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingLookup} onOpenChange={(open) => !open && setEditingLookup(null)}>
        <DialogContent className="max-w-[480px] w-full p-6 space-y-4 rounded-2xl shadow-2xl border border-slate-200 animate-fadeIn">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#64748B' }}>คลังข้อมูล</p>
            <DialogTitle className="text-sm font-black text-slate-900 leading-snug">
              แก้ไขตัวเลือกตัวกรอง
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              กรอกข้อมูลเพื่อแก้ไขตัวเลือกตัวกรอง
            </DialogDescription>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!editingLookup || !editValue) return
              try {
                const targetTable = getTableForCategory(editCategory)
                const { error } = await supabase
                  .from(targetTable)
                  .update({
                    name: editValue
                  })
                  .eq('id', editingLookup.id)
                if (error) throw error
                setEditingLookup(null)
              } catch (err: any) {
                console.error('Error updating master:', err)
              }
            }}
            className="space-y-4 text-xs"
          >
            {!defaultCategory && (
              <div>
                <label className="block text-slate-500 font-bold mb-1">หมวดหมู่ตัวกรอง (Category)</label>
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v ?? '')} items={LOOKUP_CATEGORY_OPTIONS}>
                  <SelectTrigger className="w-full light-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOOKUP_CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-slate-500 font-bold mb-1">ชื่อ</label>
              <Input
                type="text"
                required
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="เช่น Routine to Research (R2R)"
                className="w-full light-input"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingLookup(null)}
                className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none"
                style={{ background: 'linear-gradient(135deg, #00796B 0%, #00695C 100%)' }}
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
