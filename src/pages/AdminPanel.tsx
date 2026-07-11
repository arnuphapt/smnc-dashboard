import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useLookups } from '../context/LookupContext'
import { Plus, Edit2, Trash2, Settings, Users, BookOpen, X, Check } from 'lucide-react'
import { WisdomItem } from './Dashboard'
import { Profile } from '../context/AuthContext'

export const AdminPanel: React.FC = () => {
  const { options, getOptionsByCategory, refreshOptions } = useLookups()

  // Sub-tabs: 'items' | 'lookups' | 'users'
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'lookups' | 'users'>('items')

  // Loading states
  const [itemsLoading, setItemsLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Data states
  const [items, setItems] = useState<WisdomItem[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])

  // Items Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WisdomItem | null>(null)
  
  const [formCategory, setFormCategory] = useState<WisdomItem['category']>('research')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAuthors, setFormAuthors] = useState('')
  const [formIsPublic, setFormIsPublic] = useState(false)
  
  // Storage files
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [docFile, setDocFile] = useState<File | null>(null)

  // Dynamic Metadata Fields
  const [metaDept, setMetaDept] = useState('')
  const [metaSubtype, setMetaSubtype] = useState('')
  const [metaYear, setMetaYear] = useState('')
  const [metaJournal, setMetaJournal] = useState('')
  const [metaRegNum, setMetaRegNum] = useState('')
  const [metaRegDate, setMetaRegDate] = useState('')
  const [metaOrganizer, setMetaOrganizer] = useState('')
  const [metaOrgUsed, setMetaOrgUsed] = useState('')
  const [metaImpact, setMetaImpact] = useState('')

  // Lookups Form State
  const [lookupCategory, setLookupCategory] = useState('research_type')
  const [lookupValue, setLookupValue] = useState('')
  const [lookupLabel, setLookupLabel] = useState('')
  const [lookupSortOrder, setLookupSortOrder] = useState(0)

  useEffect(() => {
    fetchItems()
    fetchProfiles()

    const itemsChannel = supabase
      .channel('admin-items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wisdom_items' }, () => {
        fetchItems()
      })
      .subscribe()

    const profilesChannel = supabase
      .channel('admin-profiles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfiles()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(itemsChannel)
      supabase.removeChannel(profilesChannel)
    }
  }, [])

  const fetchItems = async () => {
    setItemsLoading(true)
    try {
      const { data, error } = await supabase
        .from('wisdom_items')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setItems((data as WisdomItem[]) || [])
    } catch (err) {
      console.error('Error fetching admin items:', err)
    } finally {
      setItemsLoading(false)
    }
  }

  const fetchProfiles = async () => {
    setUsersLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProfiles((data as Profile[]) || [])
    } catch (err) {
      console.error('Error fetching profiles:', err)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleOpenAddForm = () => {
    setEditingItem(null)
    setFormCategory('research')
    setFormTitle('')
    setFormDescription('')
    setFormAuthors('')
    setFormIsPublic(false)
    setImageFile(null)
    setDocFile(null)
    
    setMetaDept('')
    setMetaSubtype('')
    setMetaYear('')
    setMetaJournal('')
    setMetaRegNum('')
    setMetaRegDate('')
    setMetaOrganizer('')
    setMetaOrgUsed('')
    setMetaImpact('')

    setIsFormOpen(true)
  }

  const handleOpenEditForm = (item: WisdomItem) => {
    setEditingItem(item)
    setFormCategory(item.category)
    setFormTitle(item.title)
    setFormDescription(item.description || '')
    setFormAuthors(item.authors || '')
    setFormIsPublic(item.is_public)
    setImageFile(null)
    setDocFile(null)

    setMetaDept(item.metadata.department || '')
    setMetaSubtype(
      item.metadata.research_type || 
      item.metadata.ip_type || 
      item.metadata.award_level || 
      item.metadata.utilization_type || ''
    )
    setMetaYear(item.metadata.year || '')
    setMetaJournal(item.metadata.journal_name || '')
    setMetaRegNum(item.metadata.registration_number || '')
    setMetaRegDate(item.metadata.registration_date || '')
    setMetaOrganizer(item.metadata.organizer || '')
    setMetaOrgUsed(item.metadata.organization_used || '')
    setMetaImpact(item.metadata.impact_summary || '')

    setIsFormOpen(true)
  }

  const uploadFile = async (file: File, folder: string, isPublic: boolean): Promise<string> => {
    const bucket = isPublic ? 'wisdom-public' : 'wisdom-private'
    const fileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    
    const { error } = await supabase.storage.from(bucket).upload(fileName, file)
    if (error) throw error
    return fileName
  }

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      let imageUrl = editingItem?.image_url || ''
      let fileUrl = editingItem?.file_url || ''

      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'images', formIsPublic)
      }
      if (docFile) {
        fileUrl = await uploadFile(docFile, 'files', formIsPublic)
      }

      const metadata: any = {
        department: metaDept,
        year: metaYear
      }

      if (formCategory === 'research') {
        metadata.research_type = metaSubtype
        metadata.journal_name = metaJournal
      } else if (formCategory === 'innovation') {
        metadata.research_type = metaSubtype
      } else if (formCategory === 'intellectual_property') {
        metadata.ip_type = metaSubtype
        metadata.registration_number = metaRegNum
        metadata.registration_date = metaRegDate
      } else if (formCategory === 'award') {
        metadata.award_level = metaSubtype
        metadata.organizer = metaOrganizer
      } else if (formCategory === 'utilization') {
        metadata.utilization_type = metaSubtype
        metadata.organization_used = metaOrgUsed
        metadata.impact_summary = metaImpact
      }

      const rowData = {
        category: formCategory,
        title: formTitle,
        description: formDescription,
        authors: formAuthors,
        is_public: formIsPublic,
        image_url: imageUrl || null,
        file_url: fileUrl || null,
        metadata,
        updated_at: new Date().toISOString()
      }

      if (editingItem) {
        const { error } = await supabase
          .from('wisdom_items')
          .update(rowData)
          .eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { data: userData } = await supabase.auth.getUser()
        const { error } = await supabase
          .from('wisdom_items')
          .insert({
            ...rowData,
            created_by: userData.user?.id
          })
        if (error) throw error
      }

      setIsFormOpen(false)
      fetchItems()
    } catch (err: any) {
      alert(`Error saving item: ${err.message}`)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผลงานนี้ออกจากระบบ?')) return
    try {
      const { error } = await supabase
        .from('wisdom_items')
        .delete()
        .eq('id', id)
      if (error) throw error
      fetchItems()
    } catch (err: any) {
      alert(`Error deleting item: ${err.message}`)
    }
  }

  const handleAddLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookupValue || !lookupLabel) return
    try {
      const { error } = await supabase
        .from('lookup_options')
        .insert({
          category: lookupCategory,
          value: lookupValue,
          label: lookupLabel,
          sort_order: Number(lookupSortOrder)
        })
      if (error) throw error
      setLookupValue('')
      setLookupLabel('')
      setLookupSortOrder(0)
      refreshOptions()
    } catch (err: any) {
      alert(`Error creating lookup: ${err.message}`)
    }
  }

  const handleDeleteLookup = async (id: string) => {
    if (!window.confirm('คุณแน่ใจว่าต้องการลบตัวเลือกคัดกรองนี้?')) return
    try {
      const { error } = await supabase
        .from('lookup_options')
        .delete()
        .eq('id', id)
      if (error) throw error
      refreshOptions()
    } catch (err: any) {
      alert(`Error deleting lookup: ${err.message}`)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
      if (error) throw error
      fetchProfiles()
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`)
    }
  }

  const getSubtypeCategoryForForm = () => {
    switch (formCategory) {
      case 'research': return 'research_type'
      case 'innovation': return 'research_type'
      case 'intellectual_property': return 'ip_type'
      case 'award': return 'award_level'
      case 'utilization': return 'utilization_type'
      default: return ''
    }
  };

  const getSubtypeLabelForForm = () => {
    switch (formCategory) {
      case 'research': return 'ประเภทงานวิจัย'
      case 'innovation': return 'ประเภทนวัตกรรม'
      case 'intellectual_property': return 'ประเภททรัพย์สินทางปัญญา'
      case 'award': return 'ระดับรางวัล'
      case 'utilization': return 'ประเภทการนำไปใช้'
      default: return 'ประเภทย่อย'
    }
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'research': return 'วิจัย'
      case 'innovation': return 'นวัตกรรม'
      case 'intellectual_property': return 'ทรัพย์สินทางปัญญา'
      case 'award': return 'รางวัล'
      case 'utilization': return 'การใช้ประโยชน์'
      default: return cat
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Tab Switcher - Light clinical theme */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 max-w-lg shadow-sm">
        <button
          onClick={() => setActiveSubTab('items')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition ${
            activeSubTab === 'items' ? 'bg-cyan-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          จัดการผลงาน
        </button>
        <button
          onClick={() => setActiveSubTab('lookups')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition ${
            activeSubTab === 'lookups' ? 'bg-cyan-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          จัดการตัวเลือก (Dropdowns)
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition ${
            activeSubTab === 'users' ? 'bg-cyan-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          จัดการสิทธิ์ผู้ใช้
        </button>
      </div>

      {/* SUBTAB 1: Items Management */}
      {activeSubTab === 'items' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-cyan-700 rounded-full"></span>
              คลังผลงานวิจัยทั้งหมดในระบบ
            </h3>
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              เพิ่มผลงานใหม่
            </button>
          </div>

          {itemsLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">กำลังโหลดผลงาน...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold border border-dashed border-slate-200 bg-white rounded-xl shadow-sm">
              ยังไม่มีข้อมูลในคลังผลงาน
            </div>
          ) : (
            <div className="light-card rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-4">หมวดหมู่</th>
                    <th className="p-4">ชื่อผลงาน</th>
                    <th className="p-4">ผู้จัดทำ</th>
                    <th className="p-4">การเผยแพร่</th>
                    <th className="p-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition">
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200/50">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800 truncate max-w-[240px]">
                        {item.title}
                      </td>
                      <td className="p-4 text-slate-500 font-medium truncate max-w-[150px]">{item.authors || '-'}</td>
                      <td className="p-4">
                        {item.is_public ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded text-[10px] font-bold">สาธารณะ</span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded text-[10px] font-bold">เฉพาะภายใน</span>
                        )}
                      </td>
                      <td className="p-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditForm(item)}
                          className="p-1.5 rounded bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition cursor-pointer shadow-sm"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 transition cursor-pointer shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Lookup Options Management */}
      {activeSubTab === 'lookups' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add form */}
          <div className="light-card rounded-xl p-5 border-slate-200 h-fit space-y-4 shadow-sm bg-white">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-cyan-700 rounded-full"></span>
              เพิ่มตัวเลือกตัวกรองใหม่
            </h3>
            <form onSubmit={handleAddLookup} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">หมวดหมู่ตัวกรอง (Category)</label>
                <select
                  value={lookupCategory}
                  onChange={(e) => setLookupCategory(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg light-input appearance-none cursor-pointer"
                >
                  <option value="research_type">ประเภทผลงานวิจัย/นวัตกรรม (research_type)</option>
                  <option value="department">สาขาวิชา/หน่วยงาน (department)</option>
                  <option value="ip_type">ประเภททรัพย์สินทางปัญญา (ip_type)</option>
                  <option value="award_level">ระดับรางวัลเชิดชูเกียรติ (award_level)</option>
                  <option value="utilization_type">ประเภทการนำไปใช้ประโยชน์ (utilization_type)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">ค่าหลังบ้าน (Value - เช่น R2R, Patent)</label>
                <input
                  type="text"
                  required
                  value={lookupValue}
                  onChange={(e) => setLookupValue(e.target.value)}
                  placeholder="เช่น R2R"
                  className="w-full py-2 px-3 rounded-lg light-input"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">ชื่อตัวเลือกภาษาไทย/อังกฤษ (Label)</label>
                <input
                  type="text"
                  required
                  value={lookupLabel}
                  onChange={(e) => setLookupLabel(e.target.value)}
                  placeholder="เช่น Routine to Research (R2R)"
                  className="w-full py-2 px-3 rounded-lg light-input"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">ลำดับการจัดเรียง (Sort Order)</label>
                <input
                  type="number"
                  value={lookupSortOrder}
                  onChange={(e) => setLookupSortOrder(Number(e.target.value))}
                  placeholder="0"
                  className="w-full py-2 px-3 rounded-lg light-input"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-sm"
              >
                บันทึกตัวเลือก
              </button>
            </form>
          </div>

          {/* List lookup options */}
          <div className="md:col-span-2 light-card rounded-xl p-5 border-slate-200 space-y-4 shadow-sm bg-white">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-cyan-700 rounded-full"></span>
              ตัวเลือกตัวกรองปัจจุบันทั้งหมด (Realtime)
            </h3>

            {options.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">ไม่มีตัวกรองเพิ่มเติมในระบบ</p>
            ) : (
              <div className="overflow-y-auto max-h-[500px] border border-slate-100 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3">หมวดหมู่</th>
                      <th className="p-3">ค่าระบบ (Value)</th>
                      <th className="p-3">ชื่อตัวเลือก (Label)</th>
                      <th className="p-3 text-center">จัดเรียง</th>
                      <th className="p-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {options.map((opt) => (
                      <tr key={opt.id} className="hover:bg-slate-50/40 transition">
                        <td className="p-3 text-slate-500 font-semibold">{opt.category}</td>
                        <td className="p-3 text-slate-700 font-mono text-[11px]">{opt.value}</td>
                        <td className="p-3 text-slate-800 font-bold">{opt.label}</td>
                        <td className="p-3 text-center text-slate-500">{opt.sort_order}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteLookup(opt.id)}
                            className="p-1 rounded bg-red-50 hover:bg-red-650 text-red-750 hover:text-white border border-red-150 transition cursor-pointer shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: Users & Roles Management */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-cyan-700 rounded-full"></span>
            รายชื่อผู้ใช้และสิทธิ์การเข้าใช้งาน
          </h3>

          {usersLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">กำลังโหลดข้อมูลผู้ใช้...</div>
          ) : (
            <div className="light-card rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-4">อีเมลผู้ใช้งาน (Email)</th>
                    <th className="p-4">ระดับสิทธิ์ (Role)</th>
                    <th className="p-4">วันที่ลงทะเบียน</th>
                    <th className="p-4 text-center">แก้ไขบทบาทหน้าที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-slate-50/40 transition">
                      <td className="p-4 font-bold text-slate-800">
                        {profile.email}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                          profile.role === 'admin' 
                            ? 'bg-red-50 text-red-700 border border-red-200/60' 
                            : profile.role === 'expert' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200/60' 
                            : 'bg-cyan-50 text-cyan-700 border border-cyan-200/60'
                        }`}>
                          {profile.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(profile.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleUpdateRole(profile.id, 'teacher')}
                            disabled={profile.role === 'teacher'}
                            className="px-2.5 py-1 rounded bg-cyan-50 hover:bg-cyan-700 text-cyan-700 hover:text-white border border-cyan-200/40 text-[9px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            TEACHER
                          </button>
                          <button
                            onClick={() => handleUpdateRole(profile.id, 'expert')}
                            disabled={profile.role === 'expert'}
                            className="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-700 text-purple-700 hover:text-white border border-purple-200/40 text-[9px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            EXPERT
                          </button>
                          <button
                            onClick={() => handleUpdateRole(profile.id, 'admin')}
                            disabled={profile.role === 'admin'}
                            className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-700 text-red-750 hover:text-white border border-red-200/40 text-[9px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            ADMIN
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Item Add/Edit modal form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'แก้ไขข้อมูลผลงานวิจัย / คลังปัญญา' : 'เพิ่มผลงานวิจัย / คลังปัญญาใหม่'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleItemSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">เลือกหมวดหมู่คลังผลงาน (Category)</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as WisdomItem['category'])}
                    className="w-full py-2 px-3 rounded-lg light-input appearance-none cursor-pointer"
                  >
                    <option value="research">คลังวิจัย</option>
                    <option value="innovation">คลังนวัตกรรม</option>
                    <option value="intellectual_property">คลังทรัพย์สินทางปัญญา</option>
                    <option value="award">คลังรางวัลเชิดชูเกียรติ</option>
                    <option value="utilization">คลังการนำไปใช้ประโยชน์</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">หน่วยงาน / สาขาวิชา</label>
                  <select
                    value={metaDept}
                    onChange={(e) => setMetaDept(e.target.value)}
                    required
                    className="w-full py-2 px-3 rounded-lg light-input appearance-none cursor-pointer"
                  >
                    <option value="">เลือกหน่วยงาน...</option>
                    {getOptionsByCategory('department').map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">ชื่อผลงาน (Title)</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="กรอกหัวข้อผลงานวิจัย / รางวัล / นวัตกรรม"
                  className="w-full py-2 px-3 rounded-lg light-input"
                />
              </div>

              {/* Authors & Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-500 font-bold mb-1">คณะผู้จัดทำ (Authors - คั่นด้วยเครื่องหมายจุลภาค `,` )</label>
                  <input
                    type="text"
                    required
                    value={formAuthors}
                    onChange={(e) => setFormAuthors(e.target.value)}
                    placeholder="เช่น ดร.สมศักดิ์ รักเรียน, ผศ.ดร.กานดา โพธิ์ดี"
                    className="w-full py-2 px-3 rounded-lg light-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">ปีงบประมาณ / ปีที่จัดทำ</label>
                  <input
                    type="text"
                    value={metaYear}
                    onChange={(e) => setMetaYear(e.target.value)}
                    placeholder="เช่น 2569"
                    className="w-full py-2 px-3 rounded-lg light-input"
                  />
                </div>
              </div>

              {/* Category-Specific fields */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="text-[10px] font-bold text-cyan-800 uppercase tracking-widest border-b border-slate-200 pb-1.5">
                  ข้อมูลเพิ่มเติมระบุเฉพาะกลุ่ม ({getCategoryLabel(formCategory)})
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Type */}
                  {getSubtypeCategoryForForm() && (
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">{getSubtypeLabelForForm()}</label>
                      <select
                        value={metaSubtype}
                        onChange={(e) => setMetaSubtype(e.target.value)}
                        required
                        className="w-full py-2 px-3 rounded-lg light-input appearance-none cursor-pointer"
                      >
                        <option value="">เลือก{getSubtypeLabelForForm()}...</option>
                        {getOptionsByCategory(getSubtypeCategoryForForm()).map((opt) => (
                          <option key={opt.id} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Research specific */}
                  {formCategory === 'research' && (
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">ตีพิมพ์เผยแพร่ในวารสาร (ถ้ามี)</label>
                      <input
                        type="text"
                        value={metaJournal}
                        onChange={(e) => setMetaJournal(e.target.value)}
                        placeholder="เช่น วารสารพยาบาลศาสตร์"
                        className="w-full py-2 px-3 rounded-lg light-input"
                      />
                    </div>
                  )}

                  {/* IP specific */}
                  {formCategory === 'intellectual_property' && (
                    <>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">เลขทะเบียนจดสิทธิบัตร/อนุสิทธิบัตร</label>
                        <input
                          type="text"
                          value={metaRegNum}
                          onChange={(e) => setMetaRegNum(e.target.value)}
                          placeholder="เช่น 2003001234"
                          className="w-full py-2 px-3 rounded-lg light-input"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">วันที่อนุมัติ / ขึ้นทะเบียนสิทธิ์</label>
                        <input
                          type="text"
                          value={metaRegDate}
                          onChange={(e) => setMetaRegDate(e.target.value)}
                          placeholder="เช่น 12 กรกฎาคม 2569"
                          className="w-full py-2 px-3 rounded-lg light-input"
                        />
                      </div>
                    </>
                  )}

                  {/* Award specific */}
                  {formCategory === 'award' && (
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">หน่วยงานต้นสังกัดที่มอบรางวัล</label>
                      <input
                        type="text"
                        value={metaOrganizer}
                        onChange={(e) => setMetaOrganizer(e.target.value)}
                        placeholder="เช่น สมาคมพยาบาลแห่งประเทศไทย"
                        className="w-full py-2 px-3 rounded-lg light-input"
                      />
                    </div>
                  )}

                  {/* Utilization specific */}
                  {formCategory === 'utilization' && (
                    <>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">หน่วยงานหรือชุมชนที่อ้างอิงนำไปใช้</label>
                        <input
                          type="text"
                          value={metaOrgUsed}
                          onChange={(e) => setMetaOrgUsed(e.target.value)}
                          placeholder="เช่น ชุมชนตำบลเกิ้ง อ.เมือง มหาสารคาม"
                          className="w-full py-2 px-3 rounded-lg light-input"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-slate-500 font-bold mb-1">ประโยชน์เชิงประจักษ์ / ผลลัพธ์เชิงบวก</label>
                        <textarea
                          rows={2}
                          value={metaImpact}
                          onChange={(e) => setMetaImpact(e.target.value)}
                          placeholder="เขียนอธิบายประโยชน์เชิงโครงสร้างหรือการปฏิบัติจริง..."
                          className="w-full py-2 px-3 rounded-lg light-input resize-none text-[11px]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">บทคัดย่อ / รายละเอียดของผลงาน (Description / Abstract)</label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม บทคัดย่อ หรือข้อมูลอธิบาย..."
                  className="w-full py-2 px-3 rounded-lg light-input resize-none text-xs"
                />
              </div>

              {/* File uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image upload */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    ภาพประกอบหลัก ({editingItem?.image_url ? 'มีภาพเดิมแล้ว ต้องการเปลี่ยนเลือกไฟล์ใหม่' : 'เลือกอัปโหลดไฟล์ภาพ'})
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full py-1.5 px-3 rounded-lg light-input text-[10px]"
                  />
                </div>

                {/* Doc file upload */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    เอกสารแนบ PDF/Word ({editingItem?.file_url ? 'มีไฟล์เอกสารแนบแล้ว อัปใหม่เพื่อทับไฟล์เดิม' : 'เลือกอัปโหลดเอกสารแนบ'})
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full py-1.5 px-3 rounded-lg light-input text-[10px]"
                  />
                </div>
              </div>

              {/* Public/Private Toggle */}
              <div className="flex items-center gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <input
                  type="checkbox"
                  id="formIsPublic"
                  checked={formIsPublic}
                  onChange={(e) => setFormIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-700 border-slate-300 bg-white cursor-pointer"
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
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 font-bold transition shadow-sm cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {submitLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
