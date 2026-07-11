import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useLookups } from '../context/LookupContext'
import { useAuth } from '../context/AuthContext'
import { Search, Filter, FileText, Image as ImageIcon, Download, Globe, Lock, Calendar, User, Eye, X, BookOpen, Lightbulb, FileCheck, Award, Share2 } from 'lucide-react'
import { WisdomItem } from './Dashboard'

interface RepositoriesProps {
  initialCategory?: string
}

export const Repositories: React.FC<RepositoriesProps> = ({ initialCategory = 'research' }) => {
  const { user } = useAuth()
  const { getOptionsByCategory } = useLookups()

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory)
  const [items, setItems] = useState<WisdomItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [showOnlyPublic, setShowOnlyPublic] = useState(false)

  // Detail Modal state
  const [selectedItem, setSelectedItem] = useState<WisdomItem | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [signedUrlLoading, setSignedUrlLoading] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('wisdom_items')
        .select('*')
        .eq('category', activeCategory)
        .order('created_at', { ascending: false })

      if (!user) {
        query = query.eq('is_public', true)
      }

      const { data, error } = await query
      if (error) throw error
      setItems((data as WisdomItem[]) || [])
    } catch (err) {
      console.error('Error fetching wisdom items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()

    const channel = supabase
      .channel(`wisdom-items-category-${activeCategory}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wisdom_items', filter: `category=eq.${activeCategory}` },
        () => {
          fetchItems()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeCategory, user])

  useEffect(() => {
    setActiveCategory(initialCategory)
  }, [initialCategory])

  useEffect(() => {
    setSearch('')
    setSelectedDept('')
    setSelectedType('')
  }, [activeCategory])

  const getSubtypeCategory = () => {
    switch (activeCategory) {
      case 'research': return 'research_type'
      case 'innovation': return 'research_type'
      case 'intellectual_property': return 'ip_type'
      case 'award': return 'award_level'
      case 'utilization': return 'utilization_type'
      default: return ''
    }
  };

  const getSubtypeLabel = () => {
    switch (activeCategory) {
      case 'research': return 'ประเภทวิจัย'
      case 'innovation': return 'ประเภทนวัตกรรม'
      case 'intellectual_property': return 'ประเภททรัพย์สินทางปัญญา'
      case 'award': return 'ระดับรางวัล'
      case 'utilization': return 'ประเภทการนำไปใช้'
      default: return 'ประเภทย่อย'
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
      (item.authors && item.authors.toLowerCase().includes(search.toLowerCase()))

    const matchesDept = !selectedDept || item.metadata.department === selectedDept

    const matchesType = !selectedType || 
      item.metadata.research_type === selectedType || 
      item.metadata.ip_type === selectedType || 
      item.metadata.award_level === selectedType || 
      item.metadata.utilization_type === selectedType

    const matchesPublic = !showOnlyPublic || item.is_public

    return matchesSearch && matchesDept && matchesType && matchesPublic
  })

  const getMediaUrl = (urlOrPath: string, isPublic: boolean) => {
    if (!urlOrPath) return ''
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      return urlOrPath
    }
    const bucket = isPublic ? 'wisdom-public' : 'wisdom-private'
    const { data } = supabase.storage.from(bucket).getPublicUrl(urlOrPath)
    return data.publicUrl
  }

  const handleOpenDetail = async (item: WisdomItem) => {
    setSelectedItem(item)
    setSignedUrl(null)

    if (item.file_url && !item.is_public && user) {
      setSignedUrlLoading(true)
      try {
        const { data, error } = await supabase.storage
          .from('wisdom-private')
          .createSignedUrl(item.file_url, 300)
        if (error) throw error
        setSignedUrl(data?.signedUrl || null)
      } catch (err) {
        console.error('Error generating signed URL:', err)
      } finally {
        setSignedUrlLoading(false)
      }
    }
  }

  const categories = [
    { id: 'research', label: 'คลังวิจัย', icon: BookOpen },
    { id: 'innovation', label: 'คลังนวัตกรรม', icon: Lightbulb },
    { id: 'intellectual_property', label: 'ทรัพย์สินทางปัญญา', icon: FileCheck },
    { id: 'award', label: 'รางวัลเกียรติยศ', icon: Award },
    { id: 'utilization', label: 'การนำไปใช้ประโยชน์', icon: Share2 },
  ]

  const getSubtypeOptionLabel = (_category: string, value: string) => {
    const list = getOptionsByCategory(getSubtypeCategory())
    return list.find(o => o.value === value)?.label || value
  }

  const getDeptOptionLabel = (value: string) => {
    const list = getOptionsByCategory('department')
    return list.find(o => o.value === value)?.label || value
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 -mb-px transition ${
                activeCategory === cat.id
                  ? 'border-cyan-700 text-cyan-800 bg-cyan-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Filters Bar */}
      <div className="light-card rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center shadow-sm">
        {/* Search */}
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อผลงาน, คำสำคัญ, ผู้แต่ง..."
            className="w-full pl-9 pr-4 py-2 rounded-lg light-input text-xs"
          />
        </div>

        {/* Department Filter */}
        <div className="relative">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full pl-3 pr-8 py-2 rounded-lg light-input text-xs appearance-none cursor-pointer"
          >
            <option value="">ทุกสาขาวิชา / ทุกหน่วยงาน</option>
            {getOptionsByCategory('department').map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Category Specific Subtype Filter */}
        {getSubtypeCategory() && (
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-3 pr-8 py-2 rounded-lg light-input text-xs appearance-none cursor-pointer"
            >
              <option value="">{`ทุก${getSubtypeLabel()}`}</option>
              {getOptionsByCategory(getSubtypeCategory()).map((opt) => (
                <option key={opt.id} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}

        {/* Public filter toggle */}
        {user && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="publicOnly"
              checked={showOnlyPublic}
              onChange={(e) => setShowOnlyPublic(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-700 border-slate-300 bg-white cursor-pointer"
            />
            <label htmlFor="publicOnly" className="text-xs text-slate-500 font-semibold cursor-pointer select-none">
              แสดงเฉพาะผลงานสาธารณะ
            </label>
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-cyan-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-semibold">กำลังโหลดรายการผลงาน...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 light-card rounded-2xl text-center text-slate-500 text-xs font-semibold">
          ไม่พบข้อมูลผลงานในคลังหัวข้อนี้
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const hasImage = !!item.image_url
            const deptLabel = item.metadata.department ? getDeptOptionLabel(item.metadata.department) : ''
            
            const categorySubtype = item.metadata.research_type || 
                                    item.metadata.ip_type || 
                                    item.metadata.award_level || 
                                    item.metadata.utilization_type

            const subtypeLabel = categorySubtype ? getSubtypeOptionLabel(activeCategory, categorySubtype) : ''

            return (
              <div
                key={item.id}
                className="light-card rounded-xl overflow-hidden flex flex-col h-[390px] border border-slate-200 relative group shadow-sm hover:border-cyan-700/30 transition duration-300"
              >
                {/* Image Cover */}
                <div className="h-40 w-full relative bg-slate-50 overflow-hidden shrink-0 border-b border-slate-100 flex items-center justify-center">
                  {hasImage ? (
                    <img
                      src={getMediaUrl(item.image_url!, item.is_public)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-300 group-hover:text-cyan-700/40 transition">
                      <ImageIcon className="w-10 h-10 stroke-[1.5]" />
                      <span className="text-[9px] font-bold">ไม่มีภาพประกอบ</span>
                    </div>
                  )}
                  {/* Public/Private badge */}
                  <div className="absolute top-3 right-3 z-10 flex gap-1">
                    {item.is_public ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-cyan-700 bg-white/90 border border-cyan-200/50 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm">
                        <Globe className="w-2.5 h-2.5" /> สาธารณะ
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-white/90 border border-amber-200/50 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm">
                        <Lock className="w-2.5 h-2.5" /> ภายในสถาบัน
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-5 flex flex-col justify-between flex-grow overflow-hidden bg-white">
                  <div className="space-y-2 overflow-hidden flex-grow">
                    <div className="flex items-center gap-1.5 text-[9px] text-cyan-800 font-bold uppercase tracking-wider">
                      {subtypeLabel && <span>{subtypeLabel}</span>}
                      {subtypeLabel && deptLabel && <span>•</span>}
                      {deptLabel && <span className="text-slate-500">{deptLabel}</span>}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-cyan-700 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                      {item.description || 'ไม่มีคำอธิบายหรือบทคัดย่อสำหรับรายการนี้'}
                    </p>
                  </div>

                  {/* Authors & Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                    <span className="flex items-center gap-1 max-w-[70%] truncate">
                      <User className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{item.authors || 'ไม่ระบุผู้แต่ง'}</span>
                    </span>
                    <button
                      onClick={() => handleOpenDetail(item)}
                      className="px-3 py-1 rounded bg-cyan-50 hover:bg-cyan-700 text-cyan-700 hover:text-white font-bold transition flex items-center gap-1 cursor-pointer shadow-sm border border-cyan-200/30"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      เปิดดู
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal - Pure light sheet design */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start shrink-0">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200/40 uppercase tracking-wider">
                  {categories.find(c => c.id === selectedItem.category)?.label}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                  {selectedItem.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed text-slate-700">
              {/* Image Banner */}
              {selectedItem.image_url && (
                <div className="w-full h-64 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/60">
                  <img
                    src={getMediaUrl(selectedItem.image_url, selectedItem.is_public)}
                    alt={selectedItem.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Author & Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-700 shrink-0" />
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">คณะผู้จัดทำ</div>
                    <div className="text-xs text-slate-800 font-semibold">{selectedItem.authors || 'ไม่ระบุ'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-700 shrink-0" />
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">วันที่จัดเก็บคลัง</div>
                    <div className="text-xs text-slate-800 font-semibold font-mono">
                      {new Date(selectedItem.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {selectedItem.metadata.department && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-700 shrink-0" />
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">สาขาวิชา/หน่วยงาน</div>
                      <div className="text-xs text-slate-800 font-semibold">{getDeptOptionLabel(selectedItem.metadata.department)}</div>
                    </div>
                  </div>
                )}

                {/* Subtype metadata fields */}
                {Object.entries(selectedItem.metadata).map(([key, val]) => {
                  if (key === 'department' || !val) return null
                  const labelMap: Record<string, string> = {
                    research_type: 'ประเภทงานวิจัย',
                    ip_type: 'ประเภททรัพย์สินทางปัญญา',
                    award_level: 'ระดับรางวัลเชิดชูเกียรติ',
                    utilization_type: 'ประเภทการใช้ประโยชน์',
                    journal_name: 'ตีพิมพ์ในวารสาร',
                    registration_number: 'เลขทะเบียนเอกสารสิทธิ์',
                    registration_date: 'วันที่จดทะเบียนสิทธิ์',
                    organizer: 'ผู้มอบรางวัล/ผู้ประสานจัดงาน',
                    organization_used: 'หน่วยงานที่อ้างอิงนำไปใช้',
                    impact_summary: 'ประโยชน์เชิงประจักษ์',
                    year: 'ปีจัดทำ/ปีงบประมาณ',
                  }
                  
                  const label = labelMap[key] || key
                  let displayVal = val as string
                  if (key.endsWith('_type') || key === 'award_level') {
                    displayVal = getSubtypeOptionLabel(selectedItem.category, val as string)
                  }

                  return (
                    <div key={key} className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-700 shrink-0" />
                      <div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</div>
                        <div className="text-xs text-slate-800 font-semibold">{displayVal}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">บทคัดย่อ / รายละเอียดเพิ่มเติม</h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedItem.description || 'ไม่มีคำอธิบายรายละเอียด'}
                </div>
              </div>

              {/* Download File File Section */}
              {selectedItem.file_url && (
                <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 text-cyan-700 rounded-lg flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">เอกสารแนบประจำผลงาน</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {selectedItem.is_public ? 'แฟ้มเอกสารเปิดเผยทั่วไป (Public)' : 'แฟ้มเอกสารเฉพาะบุคคลที่ล็อกอินในระบบสถาบัน (Private)'}
                      </div>
                    </div>
                  </div>

                  {selectedItem.is_public ? (
                    <a
                      href={getMediaUrl(selectedItem.file_url, true)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      ดาวน์โหลด
                    </a>
                  ) : user ? (
                    signedUrlLoading ? (
                      <button disabled className="px-4 py-2 rounded-lg bg-slate-200 text-slate-500 text-xs flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                        กำลังดึงไฟล์...
                      </button>
                    ) : signedUrl ? (
                      <a
                        href={signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        ดาวน์โหลดเอกสาร (Private)
                      </a>
                    ) : (
                      <button disabled className="px-4 py-2 rounded-lg bg-red-100 text-red-700 border border-red-200 text-xs">
                        ไฟล์ล้มเหลว
                      </button>
                    )
                  ) : (
                    <div className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                      <Lock className="w-3.5 h-3.5" />
                      ล็อกอินก่อนเพื่อรับสิทธิ์ดาวน์โหลด
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition shadow-sm cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
