'use client'

import React from 'react'
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react'
import { DataTableColumn } from '@/components/DataTable'
import { MasterDataTable } from '@/components/MasterDataTable'
import { WisdomItem } from '../Dashboard'
import { getMediaUrl } from '@/services/supabase'

import { formatAuthorsForDisplay } from '@/utils/authorHelper'

interface ItemsTabProps {
  items: WisdomItem[]
  itemsLoading: boolean
  itemSearch: string
  setItemSearch: (value: string) => void
  getCategoryLabel: (category: string) => string
  onOpenAddForm: (defaultCategory?: WisdomItem['category']) => void
  onOpenEditForm: (item: WisdomItem) => void
  onDeleteItem: (id: string) => void
  category?: string
}

export const ItemsTab: React.FC<ItemsTabProps> = ({
  items,
  itemsLoading,
  itemSearch,
  setItemSearch,
  getCategoryLabel,
  onOpenAddForm,
  onOpenEditForm,
  onDeleteItem,
  category,
}) => {
  const [selectedPublicity, setSelectedPublicity] = React.useState('')

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
        <div className="flex items-center gap-2.5">
          {item.image_url && (
            <img
              src={getMediaUrl(item.image_url, item.is_public)}
              alt={item.title}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          )}
          <span className="font-bold truncate block max-w-[240px]" style={{ color: '#0B1D3A' }}>{item.title}</span>
        </div>
      ),
    },
    {
      key: 'authors',
      header: 'ผู้จัดทำ',
      render: (item) => <span className="text-slate-500 font-medium truncate block max-w-[150px]">{formatAuthorsForDisplay(item.authors) || '-'}</span>,
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
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
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
            <Trash2 className="w-3.5 h-3.5" />
            ลบ
          </button>
        </div>
      ),
    },
  ]

  // Determine dynamic title and default category behavior
  let pageTitle = 'คลังผลงานวิจัยทั้งหมดในระบบ'
  let pageBadge = 'เนื้อหา'

  if (category === 'research') {
    pageTitle = 'จัดการผลงานวิจัย'
    pageBadge = 'ผลงานวิจัย'
  } else if (category === 'innovation') {
    pageTitle = 'จัดการนวัตกรรม'
    pageBadge = 'นวัตกรรม'
  } else if (category === 'intellectual_property') {
    pageTitle = 'จัดการทรัพย์สินทางปัญญา'
    pageBadge = 'ทรัพย์สินทางปัญญา'
  } else if (category === 'award') {
    pageTitle = 'จัดการรางวัลและความสำเร็จ'
    pageBadge = 'รางวัล'
  } else if (category === 'utilization') {
    pageTitle = 'การนำผลงานวิจัยและวิจัยไปใช้ประโยชน์'
    pageBadge = 'การนำไปใช้ประโยชน์'
  }

  // Filter items by category first if specified, then by search and publicity
  const displayedItems = items.filter((item) => {
    const matchesRouteCat = !category || item.category === category
    const matchesSearch = !itemSearch.trim() ||
      item.title.toLowerCase().includes(itemSearch.trim().toLowerCase()) ||
      (item.authors || '').toLowerCase().includes(itemSearch.trim().toLowerCase())
    const matchesPublicity = !selectedPublicity || (selectedPublicity === 'public' ? item.is_public : !item.is_public)

    return matchesRouteCat && matchesSearch && matchesPublicity
  })

  return (
    <MasterDataTable
      badge={pageBadge}
      title={pageTitle}
      actionButton={{
        label: `เพิ่ม${pageBadge}ใหม่`,
        onClick: () => onOpenAddForm(category as WisdomItem['category']),
        icon: <Plus className="w-4 h-4" />
      }}
      searchPlaceholder="ค้นหาชื่อผลงานหรือผู้จัดทำ..."
      searchValue={itemSearch}
      onSearchChange={setItemSearch}
      filters={[
        {
          key: 'publicity',
          label: 'การเผยแพร่',
          value: selectedPublicity,
          onChange: setSelectedPublicity,
          options: [
            { value: 'public', label: 'สาธารณะ' },
            { value: 'private', label: 'เฉพาะภายใน' }
          ]
        }
      ]}
      columns={columns}
      data={displayedItems}
      getRowKey={(item) => item.id}
      loading={itemsLoading}
      loadingLabel="กำลังโหลดผลงาน..."
      empty={{
        icon: <BookOpen className="w-10 h-10 stroke-[1.5]" />,
        title: items.length === 0 ? 'ยังไม่มีข้อมูลในคลังผลงาน' : 'ไม่พบผลงานที่ตรงกับคำค้นหา',
        body: items.length === 0 ? `กด "เพิ่ม${pageBadge}ใหม่" เพื่อเริ่มบันทึกรายการแรก` : 'ลองค้นหาด้วยคำอื่น หรือกดล้างช่องค้นหา',
        dashed: true
      }}
    />
  )
}
