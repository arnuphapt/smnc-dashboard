'use client'

import React, { useState } from 'react'
import { Clipboard, Edit2, Trash2, ExternalLink, Plus } from 'lucide-react'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase } from '@/services/supabase'

interface IpTabProps {
  newFormTitle: string
  setNewFormTitle: (value: string) => void
  newFormCat: 'ethics' | 'ip' | 'utilization'
  setNewFormCat: (value: 'ethics' | 'ip' | 'utilization') => void
  newFormUrl: string
  setNewFormUrl: (value: string) => void
  onAddDownloadableForm: (e: React.FormEvent) => void
  downloadableForms: any[]
  onDeleteDownloadableForm: (id: string) => void
}

export const IpTab: React.FC<IpTabProps> = ({
  newFormTitle, setNewFormTitle, newFormCat, setNewFormCat, newFormUrl, setNewFormUrl,
  onAddDownloadableForm, downloadableForms, onDeleteDownloadableForm,
}) => {
  const ipForms = downloadableForms.filter((f) => f.category === 'ip')

  const [formSearch, setFormSearch] = useState('')
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)

  // Edit Form States
  const [editingForm, setEditingForm] = useState<any | null>(null)
  const [editFormTitle, setEditFormTitle] = useState('')
  const [editFormCat, setEditFormCat] = useState<'ethics' | 'ip' | 'utilization'>('ip')
  const [editFormUrl, setEditFormUrl] = useState('')

  const filteredForms = formSearch.trim()
    ? ipForms.filter((form) =>
        form.title.toLowerCase().includes(formSearch.toLowerCase())
      )
    : ipForms

  const formColumns: DataTableColumn<any>[] = [
    {
      key: 'title',
      header: 'ชื่อเอกสาร / แบบฟอร์ม',
      render: (form) => <span className="font-bold text-slate-850">{form.title}</span>
    },
    {
      key: 'file_url',
      header: 'ลิงก์ดาวน์โหลด',
      render: (form) => (
        <a
          href={form.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          เปิดไฟล์แนบ
        </a>
      )
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (form) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setEditingForm(form)
              setEditFormTitle(form.title)
              setEditFormCat(form.category)
              setEditFormUrl(form.file_url)
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
          >
            <Edit2 className="w-3 h-3" />
            แก้ไข
          </button>
          <button
            onClick={() => onDeleteDownloadableForm(form.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#FFF1F2', color: '#9F1239', borderColor: '#FECDD3' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            ลบ
          </button>
        </div>
      )
    }
  ]

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setNewFormCat('ip')
    onAddDownloadableForm(e)
    setIsAddFormOpen(false)
  }

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Forms List */}
      <DataTable
        badge="เอกสารประกอบ"
        title="แบบฟอร์มดาวน์โหลดทรัพย์สินทางปัญญา"
        actionButton={{
          label: 'เพิ่มแบบฟอร์มดาวน์โหลด',
          onClick: () => setIsAddFormOpen(true),
          icon: <Plus className="w-4 h-4" />
        }}
        searchPlaceholder="ค้นหาแบบฟอร์มดาวน์โหลด..."
        searchValue={formSearch}
        onSearchChange={setFormSearch}
        columns={formColumns}
        data={filteredForms}
        getRowKey={(form) => form.id}
        empty={{
          icon: <Clipboard className="w-9 h-9 stroke-[1.5]" />,
          title: 'ไม่มีแบบฟอร์มดาวน์โหลดในระบบ',
          dashed: true
        }}
      />

      {/* Add Form Dialog */}
      <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
        <DialogContent className="max-w-[480px] w-full p-6 space-y-4 rounded-2xl shadow-2xl border border-slate-200 animate-fadeIn">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>แบบฟอร์มดาวน์โหลด</p>
            <DialogTitle className="text-sm font-black text-slate-900 leading-snug">
              เพิ่มแบบฟอร์มดาวน์โหลด IP
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              ข้อความนี้จะแสดงในเมนูเอกสารดาวน์โหลดสำหรับผู้ใช้ทั่วไป
            </DialogDescription>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-500 mb-1">ชื่อเอกสาร / แบบฟอร์ม *</label>
              <Input
                type="text"
                required
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                placeholder="เช่น แบบฟอร์มขอจดทะเบียนลิขสิทธิ์..."
                className="w-full light-input text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">หมวดหมู่เอกสาร *</label>
              <select
                value={newFormCat}
                onChange={(e) => setNewFormCat(e.target.value as 'ethics' | 'ip' | 'utilization')}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              >
                <option value="ip">ทรัพย์สินทางปัญญา (IP)</option>
                <option value="ethics">จริยธรรมการวิจัย (Ethics)</option>
                <option value="utilization">เอกสารการนำไปใช้ประโยชน์ (Utilization)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">URL ไฟล์เอกสาร *</label>
              <Input
                type="url"
                required
                value={newFormUrl}
                onChange={(e) => setNewFormUrl(e.target.value)}
                placeholder="https://example.com/form.pdf"
                className="w-full light-input text-xs"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none"
                style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
              >
                บันทึกแบบฟอร์ม
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog open={!!editingForm} onOpenChange={(open) => !open && setEditingForm(null)}>
        <DialogContent className="max-w-[480px] w-full p-6 space-y-4 rounded-2xl shadow-2xl border border-slate-200 animate-fadeIn">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>แบบฟอร์มดาวน์โหลด</p>
            <DialogTitle className="text-sm font-black text-slate-900 leading-snug">
              แก้ไขแบบฟอร์มดาวน์โหลด
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              แก้ไขรายละเอียดและลิงก์เอกสารของแบบฟอร์มดาวน์โหลด
            </DialogDescription>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!editingForm || !editFormTitle || !editFormUrl) return
              try {
                const { error } = await supabase.from('downloadable_forms').update({
                  title: editFormTitle,
                  category: editFormCat,
                  file_url: editFormUrl
                }).eq('id', editingForm.id)
                if (error) throw error
                setEditingForm(null)
              } catch (err: any) {
                console.error('Error updating downloadable form:', err)
              }
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-500 mb-1">ชื่อเอกสาร / แบบฟอร์ม *</label>
              <Input
                type="text"
                required
                value={editFormTitle}
                onChange={(e) => setEditFormTitle(e.target.value)}
                placeholder="เช่น แบบฟอร์มขอจดทะเบียนลิขสิทธิ์..."
                className="w-full light-input text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">หมวดหมู่เอกสาร *</label>
              <select
                value={editFormCat}
                onChange={(e) => setEditFormCat(e.target.value as 'ethics' | 'ip')}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              >
                <option value="ip">ทรัพย์สินทางปัญญา (IP)</option>
                <option value="ethics">จริยธรรมการวิจัย (Ethics)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">URL ไฟล์เอกสาร *</label>
              <Input
                type="url"
                required
                value={editFormUrl}
                onChange={(e) => setEditFormUrl(e.target.value)}
                placeholder="https://example.com/form.pdf"
                className="w-full light-input text-xs"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingForm(null)}
                className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none"
                style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
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
