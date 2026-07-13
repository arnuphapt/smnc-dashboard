import React from 'react'
import { Plus, Edit2, Trash2, Search, BookOpen } from 'lucide-react'
import { DataTable, DataTableColumn } from '../../components/DataTable'
import { WisdomItem } from '../Dashboard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ItemsTabProps {
  items: WisdomItem[]
  filteredItems: WisdomItem[]
  itemsLoading: boolean
  itemSearch: string
  setItemSearch: (value: string) => void
  getCategoryLabel: (category: string) => string
  onOpenAddForm: () => void
  onOpenEditForm: (item: WisdomItem) => void
  onDeleteItem: (id: string) => void
}

export const ItemsTab: React.FC<ItemsTabProps> = ({
  items,
  filteredItems,
  itemsLoading,
  itemSearch,
  setItemSearch,
  getCategoryLabel,
  onOpenAddForm,
  onOpenEditForm,
  onDeleteItem,
}) => {
  const columns: DataTableColumn<WisdomItem>[] = [
    {
      key: 'category',
      header: 'หมวดหมู่',
      render: (item) => (
        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200/50">
          {getCategoryLabel(item.category)}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'ชื่อผลงาน',
      render: (item) => (
        <span className="font-bold truncate block max-w-[240px]" style={{ color: '#0B1D3A' }}>{item.title}</span>
      ),
    },
    {
      key: 'authors',
      header: 'ผู้จัดทำ',
      render: (item) => <span className="text-slate-500 font-medium truncate block max-w-[150px]">{item.authors || '-'}</span>,
    },
    {
      key: 'is_public',
      header: 'การเผยแพร่',
      render: (item) =>
        item.is_public ? (
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">สาธารณะ</span>
        ) : (
          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">เฉพาะภายใน</span>
        ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onOpenEditForm(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
          >
            <Edit2 className="w-3 h-3" />
            แก้ไข
          </button>
          <button
            onClick={() => onDeleteItem(item.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#FFF1F2', color: '#9F1239', borderColor: '#FECDD3' }}
          >
            <Trash2 className="w-3 h-3" />
            ลบ
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>เนื้อหา</p>
          <h3 className="text-base font-black" style={{ color: '#0B1D3A' }}>คลังผลงานวิจัยทั้งหมดในระบบ</h3>
        </div>
        <Button onClick={onOpenAddForm} className="btn-primary text-xs flex items-center gap-1.5 !py-2 !px-4 h-auto">
          <Plus className="w-4 h-4 stroke-[3]" />
          เพิ่มผลงานใหม่
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: '#94A3B8' }} />
        <Input
          type="text"
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          placeholder="ค้นหาชื่อผลงานหรือผู้จัดทำ..."
          className="w-full pl-9 pr-4 py-2 h-auto rounded-xl text-xs light-input"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        getRowKey={(item) => item.id}
        loading={itemsLoading}
        loadingLabel="กำลังโหลดผลงาน..."
        resetKey={itemSearch}
        empty={{
          icon: <BookOpen className="w-10 h-10 stroke-[1.5]" />,
          title: items.length === 0 ? 'ยังไม่มีข้อมูลในคลังผลงาน' : 'ไม่พบผลงานที่ตรงกับคำค้นหา',
          body: items.length === 0 ? 'กด "เพิ่มผลงานใหม่" เพื่อเริ่มบันทึกรายการแรก' : 'ลองค้นหาด้วยคำอื่น หรือกดล้างช่องค้นหา',
          dashed: true,
        }}
      />
    </div>
  )
}
