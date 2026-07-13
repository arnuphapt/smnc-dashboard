import React from 'react'
import { Trash2, Settings } from 'lucide-react'
import { DataTable, DataTableColumn } from '../../components/DataTable'
import { LookupOption } from '../../context/LookupContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const LOOKUP_CATEGORY_OPTIONS = [
  { value: 'research_type', label: 'ประเภทผลงานวิจัย/นวัตกรรม (research_type)' },
  { value: 'department', label: 'สาขาวิชา/หน่วยงาน (department)' },
  { value: 'ip_type', label: 'ประเภททรัพย์สินทางปัญญา (ip_type)' },
  { value: 'award_level', label: 'ระดับรางวัลเชิดชูเกียรติ (award_level)' },
  { value: 'utilization_type', label: 'ประเภทการนำไปใช้ประโยชน์ (utilization_type)' },
]

interface LookupsTabProps {
  options: LookupOption[]
  lookupCategory: string
  setLookupCategory: (value: string) => void
  lookupValue: string
  setLookupValue: (value: string) => void
  lookupLabel: string
  setLookupLabel: (value: string) => void
  lookupSortOrder: number
  setLookupSortOrder: (value: number) => void
  onAddLookup: (e: React.FormEvent) => void
  onDeleteLookup: (id: string) => void
}

export const LookupsTab: React.FC<LookupsTabProps> = ({
  options,
  lookupCategory,
  setLookupCategory,
  lookupValue,
  setLookupValue,
  lookupLabel,
  setLookupLabel,
  lookupSortOrder,
  setLookupSortOrder,
  onAddLookup,
  onDeleteLookup,
}) => {
  const columns: DataTableColumn<LookupOption>[] = [
    { key: 'category', header: 'หมวดหมู่', render: (opt) => <span className="text-slate-500 font-semibold">{opt.category}</span> },
    { key: 'value', header: 'ค่าระบบ', render: (opt) => <span className="font-mono text-[11px]" style={{ color: '#0EA5A0' }}>{opt.value}</span> },
    { key: 'label', header: 'ชื่อตัวเลือก', render: (opt) => <span className="font-bold" style={{ color: '#0B1D3A' }}>{opt.label}</span> },
    { key: 'sort_order', header: 'จัดเรียง', align: 'center', render: (opt) => <span className="text-slate-500 font-mono">{opt.sort_order}</span> },
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Add form */}
      <div className="rounded-2xl p-5 h-fit space-y-4" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>เนื้อหา</p>
          <h3 className="text-sm font-black" style={{ color: '#0B1D3A' }}>เพิ่มตัวเลือกตัวกรองใหม่</h3>
        </div>
        <form onSubmit={onAddLookup} className="space-y-4 text-xs">
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

          <div>
            <label className="block text-slate-500 font-bold mb-1">ค่าหลังบ้าน (Value - เช่น R2R, Patent)</label>
            <Input
              type="text"
              required
              value={lookupValue}
              onChange={(e) => setLookupValue(e.target.value)}
              placeholder="เช่น R2R"
              className="w-full light-input"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">ชื่อตัวเลือกภาษาไทย/อังกฤษ (Label)</label>
            <Input
              type="text"
              required
              value={lookupLabel}
              onChange={(e) => setLookupLabel(e.target.value)}
              placeholder="เช่น Routine to Research (R2R)"
              className="w-full light-input"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">ลำดับการจัดเรียง (Sort Order)</label>
            <Input
              type="number"
              value={lookupSortOrder}
              onChange={(e) => setLookupSortOrder(Number(e.target.value))}
              placeholder="0"
              className="w-full light-input"
            />
          </div>

          <Button type="submit" className="btn-primary w-full !py-2 h-auto">
            บันทึกตัวเลือก
          </Button>
        </form>
      </div>

      {/* List lookup options */}
      <div className="md:col-span-2 rounded-2xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>เรียลไทม์</p>
            <h3 className="text-sm font-black" style={{ color: '#0B1D3A' }}>ตัวเลือกตัวกรองปัจจุบันทั้งหมด</h3>
          </div>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.2)' }}
          >
            {options.length} รายการ
          </span>
        </div>

        <DataTable
          columns={columns}
          data={options}
          getRowKey={(opt) => opt.id}
          empty={{
            icon: <Settings className="w-9 h-9 stroke-[1.5]" />,
            title: 'ยังไม่มีตัวกรองเพิ่มเติมในระบบ',
            body: 'เพิ่มตัวเลือกจากฟอร์มด้านซ้ายเพื่อให้เลือกได้ในฟอร์มบันทึกผลงาน',
          }}
        />
      </div>
    </div>
  )
}
