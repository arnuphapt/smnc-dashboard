import React from 'react'
import { Check, X } from 'lucide-react'
import { WisdomItem } from '../Dashboard'
import { LookupOption } from '../../context/LookupContext'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

interface ItemFormModalProps {
  isFormOpen: boolean
  setIsFormOpen: (open: boolean) => void
  editingItem: WisdomItem | null
  submitLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  getOptionsByCategory: (category: string) => LookupOption[]
  getCategoryLabel: (category: string) => string
  getSubtypeCategoryForForm: () => string
  getSubtypeLabelForForm: () => string

  formCategory: WisdomItem['category']
  setFormCategory: (value: WisdomItem['category']) => void
  formTitle: string
  setFormTitle: (value: string) => void
  formDescription: string
  setFormDescription: (value: string) => void
  formAuthors: string
  setFormAuthors: (value: string) => void
  formIsPublic: boolean
  setFormIsPublic: (value: boolean) => void
  setImageFile: (file: File | null) => void
  setDocFile: (file: File | null) => void

  metaDept: string
  setMetaDept: (value: string) => void
  metaSubtype: string
  setMetaSubtype: (value: string) => void
  metaYear: string
  setMetaYear: (value: string) => void
  metaJournal: string
  setMetaJournal: (value: string) => void
  metaRegNum: string
  setMetaRegNum: (value: string) => void
  metaRegDate: string
  setMetaRegDate: (value: string) => void
  metaOrganizer: string
  setMetaOrganizer: (value: string) => void
  metaOrgUsed: string
  setMetaOrgUsed: (value: string) => void
  metaImpact: string
  setMetaImpact: (value: string) => void
}

const CATEGORY_OPTIONS: { value: WisdomItem['category']; label: string }[] = [
  { value: 'research', label: 'คลังวิจัย' },
  { value: 'innovation', label: 'คลังนวัตกรรม' },
  { value: 'intellectual_property', label: 'คลังทรัพย์สินทางปัญญา' },
  { value: 'award', label: 'คลังรางวัลเชิดชูเกียรติ' },
  { value: 'utilization', label: 'คลังการนำไปใช้ประโยชน์' },
]

// The one add/edit surface for wisdom_items — every category's extra fields
// (research/innovation/IP/award/utilization) live in this single form, switching
// on formCategory, since they all write to the same metadata JSONB column.
export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isFormOpen, setIsFormOpen, editingItem, submitLoading, onSubmit,
  getOptionsByCategory, getCategoryLabel, getSubtypeCategoryForForm, getSubtypeLabelForForm,
  formCategory, setFormCategory, formTitle, setFormTitle, formDescription, setFormDescription,
  formAuthors, setFormAuthors, formIsPublic, setFormIsPublic, setImageFile, setDocFile,
  metaDept, setMetaDept, metaSubtype, setMetaSubtype, metaYear, setMetaYear,
  metaJournal, setMetaJournal, metaRegNum, setMetaRegNum, metaRegDate, setMetaRegDate,
  metaOrganizer, setMetaOrganizer, metaOrgUsed, setMetaOrgUsed, metaImpact, setMetaImpact,
}) => {
  const subtypeCategory = getSubtypeCategoryForForm()

  return (
    <Dialog open={isFormOpen} onOpenChange={(next) => { if (!next) setIsFormOpen(false) }}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl! sm:max-w-2xl! p-0 gap-0 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-bold text-slate-900">
            {editingItem ? 'แก้ไขข้อมูลผลงานวิจัย / คลังปัญญา' : 'เพิ่มผลงานวิจัย / คลังปัญญาใหม่'}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsFormOpen(false)}
            className="text-slate-400 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1">เลือกหมวดหมู่คลังผลงาน (Category)</label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v as WisdomItem['category'])} items={CATEGORY_OPTIONS}>
                <SelectTrigger className="w-full light-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">หน่วยงาน / สาขาวิชา</label>
              <Select
                value={metaDept}
                onValueChange={(v) => setMetaDept(v ?? '')}
                required
                items={getOptionsByCategory('department').map((opt) => ({ value: opt.value, label: opt.label }))}
              >
                <SelectTrigger className="w-full light-input">
                  <SelectValue placeholder="เลือกหน่วยงาน..." />
                </SelectTrigger>
                <SelectContent>
                  {getOptionsByCategory('department').map((opt) => (
                    <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">ชื่อผลงาน (Title)</label>
            <Input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="กรอกหัวข้อผลงานวิจัย / รางวัล / นวัตกรรม"
              className="w-full light-input"
            />
          </div>

          {/* Authors & Year */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-slate-500 font-bold mb-1">คณะผู้จัดทำ (Authors - คั่นด้วยเครื่องหมายจุลภาค `,` )</label>
              <Input
                type="text"
                required
                value={formAuthors}
                onChange={(e) => setFormAuthors(e.target.value)}
                placeholder="เช่น ดร.สมศักดิ์ รักเรียน, ผศ.ดร.กานดา โพธิ์ดี"
                className="w-full light-input"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1">ปีงบประมาณ / ปีที่จัดทำ</label>
              <Input
                type="text"
                value={metaYear}
                onChange={(e) => setMetaYear(e.target.value)}
                placeholder="เช่น 2569"
                className="w-full light-input"
              />
            </div>
          </div>

          {/* Category-Specific fields */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="text-[10px] font-bold text-teal-800 uppercase tracking-widest border-b border-slate-200 pb-1.5">
              ข้อมูลเพิ่มเติมระบุเฉพาะกลุ่ม ({getCategoryLabel(formCategory)})
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subtypeCategory && (
                <div>
                  <label className="block text-slate-500 font-bold mb-1">{getSubtypeLabelForForm()}</label>
                  <Select
                    value={metaSubtype}
                    onValueChange={(v) => setMetaSubtype(v ?? '')}
                    required
                    items={getOptionsByCategory(subtypeCategory).map((opt) => ({ value: opt.value, label: opt.label }))}
                  >
                    <SelectTrigger className="w-full light-input">
                      <SelectValue placeholder={`เลือก${getSubtypeLabelForForm()}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getOptionsByCategory(subtypeCategory).map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formCategory === 'research' && (
                <div>
                  <label className="block text-slate-500 font-bold mb-1">ตีพิมพ์เผยแพร่ในวารสาร (ถ้ามี)</label>
                  <Input
                    type="text"
                    value={metaJournal}
                    onChange={(e) => setMetaJournal(e.target.value)}
                    placeholder="เช่น วารสารพยาบาลศาสตร์"
                    className="w-full light-input"
                  />
                </div>
              )}

              {formCategory === 'intellectual_property' && (
                <>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">เลขทะเบียนจดสิทธิบัตร/อนุสิทธิบัตร</label>
                    <Input
                      type="text"
                      value={metaRegNum}
                      onChange={(e) => setMetaRegNum(e.target.value)}
                      placeholder="เช่น 2003001234"
                      className="w-full light-input"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">วันที่อนุมัติ / ขึ้นทะเบียนสิทธิ์</label>
                    <Input
                      type="text"
                      value={metaRegDate}
                      onChange={(e) => setMetaRegDate(e.target.value)}
                      placeholder="เช่น 12 กรกฎาคม 2569"
                      className="w-full light-input"
                    />
                  </div>
                </>
              )}

              {formCategory === 'award' && (
                <div>
                  <label className="block text-slate-500 font-bold mb-1">หน่วยงานต้นสังกัดที่มอบรางวัล</label>
                  <Input
                    type="text"
                    value={metaOrganizer}
                    onChange={(e) => setMetaOrganizer(e.target.value)}
                    placeholder="เช่น สมาคมพยาบาลแห่งประเทศไทย"
                    className="w-full light-input"
                  />
                </div>
              )}

              {formCategory === 'utilization' && (
                <>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">หน่วยงานหรือชุมชนที่อ้างอิงนำไปใช้</label>
                    <Input
                      type="text"
                      value={metaOrgUsed}
                      onChange={(e) => setMetaOrgUsed(e.target.value)}
                      placeholder="เช่น ชุมชนตำบลเกิ้ง อ.เมือง มหาสารคาม"
                      className="w-full light-input"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-bold mb-1">ประโยชน์เชิงประจักษ์ / ผลลัพธ์เชิงบวก</label>
                    <Textarea
                      rows={2}
                      value={metaImpact}
                      onChange={(e) => setMetaImpact(e.target.value)}
                      placeholder="เขียนอธิบายประโยชน์เชิงโครงสร้างหรือการปฏิบัติจริง..."
                      className="w-full light-input resize-none text-[11px]"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">บทคัดย่อ / รายละเอียดของผลงาน (Description / Abstract)</label>
            <Textarea
              required
              rows={4}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม บทคัดย่อ หรือข้อมูลอธิบาย..."
              className="w-full light-input resize-none text-xs"
            />
          </div>

          {/* File uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1">
                ภาพประกอบหลัก ({editingItem?.image_url ? 'มีภาพเดิมแล้ว ต้องการเปลี่ยนเลือกไฟล์ใหม่' : 'เลือกอัปโหลดไฟล์ภาพ'})
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                className="w-full light-input text-[10px] h-auto py-1.5"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">
                เอกสารแนบ PDF/Word ({editingItem?.file_url ? 'มีไฟล์เอกสารแนบแล้ว อัปใหม่เพื่อทับไฟล์เดิม' : 'เลือกอัปโหลดเอกสารแนบ'})
              </label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                className="w-full light-input text-[10px] h-auto py-1.5"
              />
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <Checkbox
              id="formIsPublic"
              checked={formIsPublic}
              onCheckedChange={(checked) => setFormIsPublic(checked === true)}
              className="w-4 h-4 data-checked:bg-teal-600 data-checked:border-teal-600"
            />
            <div>
              <label htmlFor="formIsPublic" className="block text-slate-900 font-bold cursor-pointer select-none">
                เผยแพร่เป็นผลงานสาธารณะ (Publicly Visible)
              </label>
              <span className="text-[10px] text-slate-500">
                หากเว้นว่าง จะจำกัดสิทธิ์การดูข้อมูลเฉพาะบุคลากรภายในวิทยาลัยที่เข้าสู่ระบบเท่านั้น
              </span>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="font-bold"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={submitLoading}
              className="btn-primary flex items-center gap-2 !py-2 !px-5 h-auto"
            >
              {submitLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              บันทึกข้อมูล
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
