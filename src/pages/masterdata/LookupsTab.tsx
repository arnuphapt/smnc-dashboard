import React, { useState } from 'react'
import { Trash2, Settings, Plus } from 'lucide-react'
import { DataTableColumn } from '../../components/DataTable'
import { MasterDataTable } from '../../components/MasterDataTable'
import { LookupOption } from '../../context/LookupContext'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const LOOKUP_CATEGORY_OPTIONS = [
  { value: 'research_type', label: 'ประเภทผลงานวิจัย/นวัตกรรม (research_type)' },
  { value: 'department', label: 'สาขาวิชา/หน่วยงาน (department)' },
  { value: 'ip_type', label: 'ประเภททรัพย์สินทางปัญญา (ip_type)' },
  { value: 'award_level', label: 'ระดับรางวัลเชิดชูเกียรติ (award_level)' },
  { value: 'utilization_type', label: 'ประเภทการนำไปใช้ประโยชน์ (utilization_type)' },
  { value: 'journal_rank', label: 'ระดับฐานวารสาร (journal_rank)' },
  { value: 'scope', label: 'ขอบเขตผลงาน (scope)' },
  { value: 'innovation_type', label: 'ประเภทของผลนวัตกรรม (innovation_type)' },
  { value: 'source', label: 'ที่มาของชิ้นงาน (source)' },
  { value: 'ip_current_status', label: 'สถานะปัจจุบัน IP (ip_current_status)' },
  { value: 'venue', label: 'เวทีการนำเสนอ (venue)' },
  { value: 'year', label: 'ปีที่ตีพิมพ์ (year)' },
]

interface LookupsTabProps {
  options: LookupOption[]
  lookupCategory: string
  setLookupCategory: (value: string) => void
  lookupValue: string
  setLookupValue: (value: string) => void
  onAddLookup: (e: React.FormEvent) => void
  onDeleteLookup: (id: string) => void
  defaultCategory?: string
}

export const LookupsTab: React.FC<LookupsTabProps> = ({
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

  // Sync when navigating between lookup category pages
  React.useEffect(() => {
    setSelectedCategory(defaultCategory)
    if (defaultCategory) setLookupCategory(defaultCategory)
  }, [defaultCategory])

  const columns: DataTableColumn<LookupOption>[] = [
    // The category column is only useful on the "all lookups" overview — on a
    // locked single-category page every row would repeat the same value.
    ...(defaultCategory ? [] : [
      { key: 'category', header: 'หมวดหมู่', render: (opt: LookupOption) => <span className="text-slate-500 font-semibold">{opt.category}</span> } as DataTableColumn<LookupOption>,
    ]),
    { key: 'value', header: 'ค่าระบบ', render: (opt) => <span className="font-bold" style={{ color: '#0B1D3A' }}>{opt.value}</span> },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'center',
      render: (opt) => (
        <button
          onClick={() => onDeleteLookup(opt.id)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
          style={{ background: '#FFF1F2', color: '#9F1239', borderColor: '#FECDD3' }}
        >
          <Trash2 className="w-3 h-3" />
          ลบ
        </button>
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
        badge="Master Lookups"
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
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>คลังข้อมูล</p>
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
            <div>
              <label className="block text-slate-500 font-bold mb-1">หมวดหมู่ตัวกรอง (Category)</label>
              {defaultCategory ? (
                <div className="w-full h-8 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 flex items-center font-bold">
                  {LOOKUP_CATEGORY_OPTIONS.find((o) => o.value === defaultCategory)?.label ?? defaultCategory}
                </div>
              ) : (
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
              )}
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">ค่าระบบ (Value)</label>
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
                style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
              >
                บันทึกตัวเลือก
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
