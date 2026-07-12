import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useLookups } from '../context/LookupContext'
import { useAuth } from '../context/AuthContext'
import { Search, FileText, Download, X, BookOpen, Lightbulb, FileCheck, Award, Share2, Eye, RotateCcw } from 'lucide-react'
import { WisdomItem } from './Dashboard'
import { formatExcelDate } from '../utils/format'

const VALID_CATEGORIES = ['research', 'innovation', 'intellectual_property', 'award', 'utilization']

export const Repositories: React.FC = () => {
  const { user } = useAuth()
  const { getOptionsByCategory } = useLookups()
  const { category } = useParams<{ category: string }>()
  const navigate = useNavigate()

  const activeCategory = category && VALID_CATEGORIES.includes(category) ? category : 'research'
  const [items, setItems] = useState<WisdomItem[]>([])
  const [loading, setLoading] = useState(true)

  // Dynamic filter states
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [selectedScope, setSelectedScope] = useState('')
  const [selectedRank, setSelectedRank] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedIpType, setSelectedIpType] = useState('')
  const [selectedCreatorType, setSelectedCreatorType] = useState('')
  const [selectedInnoType, setSelectedInnoType] = useState('')
  const [selectedAwardLevel, setSelectedAwardLevel] = useState('')
  const [selectedUtType, setSelectedUtType] = useState('')
  const [showOnlyPublic, setShowOnlyPublic] = useState(false)

  // Sorting state
  const [sortField, setSortField] = useState<string>('year')
  const [sortAsc, setSortAsc] = useState<boolean>(false)

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
  }, [activeCategory])

  // Reset filters when activeCategory changes
  useEffect(() => {
    handleResetFilters()
  }, [activeCategory])

  const handleResetFilters = () => {
    setSearch('')
    setSelectedYear('')
    setSelectedAuthor('')
    setSelectedScope('')
    setSelectedRank('')
    setSelectedStatus('')
    setSelectedIpType('')
    setSelectedCreatorType('')
    setSelectedInnoType('')
    setSelectedAwardLevel('')
    setSelectedUtType('')
    setShowOnlyPublic(false)
  }

  // Get unique options list from currently loaded items
  const getUniqueMetadataValues = (key: string) => {
    const vals = items
      .map(item => item.metadata?.[key])
      .filter(Boolean)
      .map(val => String(val))
    return Array.from(new Set(vals)).sort()
  }

  const getUniqueAuthors = () => {
    const vals = items
      .map(item => item.authors)
      .filter(Boolean)
      .map(val => String(val))
    return Array.from(new Set(vals)).sort()
  }

  const getSubtypeCategory = () => {
    switch (activeCategory) {
      case 'research': return 'research_type'
      case 'innovation': return 'research_type'
      case 'intellectual_property': return 'ip_type'
      case 'award': return 'award_level'
      case 'utilization': return 'utilization_type'
      default: return ''
    }
  }

  const getSubtypeOptionLabel = (_category: string, value: string) => {
    const list = getOptionsByCategory(getSubtypeCategory())
    return list.find(o => o.value === value)?.label || value
  }

  const getDeptOptionLabel = (value: string) => {
    const list = getOptionsByCategory('department')
    return list.find(o => o.value === value)?.label || value
  }

  // Filtering Logic
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
      (item.authors && item.authors.toLowerCase().includes(search.toLowerCase()))

    const matchesYear = !selectedYear || String(item.metadata?.year) === selectedYear
    const matchesAuthor = !selectedAuthor || item.authors === selectedAuthor
    const matchesScope = !selectedScope || item.metadata?.scope === selectedScope
    const matchesRank = !selectedRank || item.metadata?.journal_rank === selectedRank
    const matchesStatus = !selectedStatus || item.metadata?.status === selectedStatus
    
    // IP type mapping check
    const matchesIpType = !selectedIpType || item.metadata?.ip_type === selectedIpType
    const matchesCreatorType = !selectedCreatorType || item.metadata?.creator_type === selectedCreatorType
    const matchesInnoType = !selectedInnoType || item.metadata?.innovation_type === selectedInnoType
    const matchesAwardLevel = !selectedAwardLevel || item.metadata?.award_level === selectedAwardLevel
    const matchesUtType = !selectedUtType || item.metadata?.utilization_type === selectedUtType

    const matchesPublic = !showOnlyPublic || item.is_public

    return (
      matchesSearch &&
      matchesYear &&
      matchesAuthor &&
      matchesScope &&
      matchesRank &&
      matchesStatus &&
      matchesIpType &&
      matchesCreatorType &&
      matchesInnoType &&
      matchesAwardLevel &&
      matchesUtType &&
      matchesPublic
    )
  })

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const resolveFieldValue = (item: WisdomItem, field: string) => {
    if (field === 'title') return item.title || ''
    if (field === 'authors') return item.authors || ''
    if (field === 'created_at') return item.created_at || ''
    return item.metadata?.[field] || ''
  }

  const sortedItems = [...filteredItems].sort((a, b) => {
    let valA = resolveFieldValue(a, sortField)
    let valB = resolveFieldValue(b, sortField)

    // Handle number values (like year or index numbers)
    if (valA && valB && !isNaN(Number(valA)) && !isNaN(Number(valB))) {
      return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
    }

    valA = String(valA || '').toLowerCase()
    valB = String(valB || '').toLowerCase()
    if (valA < valB) return sortAsc ? -1 : 1
    if (valA > valB) return sortAsc ? 1 : -1
    return 0
  })

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return <span className="text-slate-400 font-mono text-[9px] ml-1">⇅</span>
    return sortAsc 
      ? <span className="text-white font-mono text-[9px] ml-1">▲</span>
      : <span className="text-white font-mono text-[9px] ml-1">▼</span>
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

  const getMediaUrl = (urlOrPath: string, isPublic: boolean) => {
    if (!urlOrPath) return ''
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      return urlOrPath
    }
    const bucket = isPublic ? 'wisdom-public' : 'wisdom-private'
    const { data } = supabase.storage.from(bucket).getPublicUrl(urlOrPath)
    return data.publicUrl
  }

  const categories = [
    { id: 'research', label: 'คลังผลงานวิจัย', icon: BookOpen },
    { id: 'intellectual_property', label: 'คลังทรัพย์สินทางปัญญา', icon: FileCheck },
    { id: 'innovation', label: 'คลังนวัตกรรม', icon: Lightbulb },
    { id: 'award', label: 'คลังรางวัลและความสำเร็จ', icon: Award },
    { id: 'utilization', label: 'การนำไปใช้ประโยชน์', icon: Share2 },
  ]

  const categoryMeta: Record<string, { label: string; subtitle: string }> = {
    research: { label: 'คลังผลงานวิจัย', subtitle: 'Research Repository' },
    intellectual_property: { label: 'คลังทรัพย์สินทางปัญญา', subtitle: 'Intellectual Property' },
    innovation: { label: 'คลังนวัตกรรม', subtitle: 'Innovation Repository' },
    award: { label: 'คลังรางวัลและความสำเร็จ', subtitle: 'Awards & Recognition' },
    utilization: { label: 'การนำไปใช้ประโยชน์', subtitle: 'Research Utilization' },
  }
  const currentMeta = categoryMeta[activeCategory] ?? { label: 'คลังปัญญา 5 ด้าน', subtitle: 'Wisdom Repositories' }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Page Header Band — matches Clinic/Ethics/IP pattern */}
      <div className="page-header-band">
        <div className="relative px-8 pt-8 pb-0">
          <span className="eyebrow-badge mb-3 inline-block">Knowledge Repository</span>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-1">
            {currentMeta.label}
          </h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {currentMeta.subtitle} — ค้นหา กรอง และเข้าถึงผลงานได้แบบเรียลไทม์
          </p>

          {/* Tab Pills */}
          <div className="flex gap-2 mt-7 overflow-x-auto pb-px">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/repositories/${cat.id}`)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all duration-200 shrink-0"
                  style={{
                    background: isActive ? '#F0F7FF' : 'rgba(255,255,255,0.07)',
                    color: isActive ? '#0B1D3A' : 'rgba(255,255,255,0.65)',
                    borderBottom: isActive ? '2px solid #0EA5A0' : '2px solid transparent',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Filters Bar */}
      <div className="content-panel p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-grow">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ชื่อเรื่อง, นักวิจัย, วารสาร..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs light-input"
            />
          </div>

          {/* Year dropdown (Common) */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="pl-3 pr-8 py-1.5 rounded-xl text-xs cursor-pointer light-input"
          >
            <option value="">ปีทั้งหมด</option>
            {getUniqueMetadataValues('year').map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          {/* Researcher dropdown (Common) */}
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="pl-3 pr-8 py-1.5 rounded-xl text-xs cursor-pointer light-input max-w-[150px] truncate"
          >
            <option value="">นักวิจัยทั้งหมด</option>
            {getUniqueAuthors().map(auth => (
              <option key={auth} value={auth}>{auth}</option>
            ))}
          </select>

          {/* Category-Specific Filters */}
          {activeCategory === 'research' && (
            <>
              {/* Scope filter */}
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-xl text-xs cursor-pointer light-input"
              >
                <option value="">ขอบเขตทั้งหมด</option>
                {getUniqueMetadataValues('scope').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Rank filter */}
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-xl text-xs cursor-pointer light-input"
              >
                <option value="">ระดับฐานทั้งหมด</option>
                {getUniqueMetadataValues('journal_rank').map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </>
          )}

          {activeCategory === 'intellectual_property' && (
            <>
              {/* IP Type filter */}
              <select
                value={selectedIpType}
                onChange={(e) => setSelectedIpType(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-xl text-xs cursor-pointer light-input"
              >
                <option value="">ประเภทสิทธิ์ทั้งหมด</option>
                <option value="PettyPatent">อนุสิทธิบัตร</option>
                <option value="Copyright">ลิขสิทธิ์</option>
                <option value="Patent">สิทธิบัตร</option>
                <option value="Trademark">เครื่องหมายการค้า</option>
              </select>

              {/* Current Status filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-xl text-xs cursor-pointer light-input"
              >
                <option value="">สถานะทั้งหมด</option>
                {getUniqueMetadataValues('status').map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </>
          )}

          {activeCategory === 'innovation' && (
            <>
              {/* Creator Type filter */}
              <select
                value={selectedCreatorType}
                onChange={(e) => setSelectedCreatorType(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-xl text-xs cursor-pointer light-input"
              >
                <option value="">ผู้สร้างสรรค์ทั้งหมด</option>
                {getUniqueMetadataValues('creator_type').map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>

              {/* Innovation Type filter */}
              <select
                value={selectedInnoType}
                onChange={(e) => setSelectedInnoType(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-xl text-xs cursor-pointer light-input"
              >
                <option value="">ประเภทนวัตกรรมทั้งหมด</option>
                {getUniqueMetadataValues('innovation_type').map(it => (
                  <option key={it} value={it}>{it}</option>
                ))}
              </select>
            </>
          )}

          {activeCategory === 'award' && (
            <>
              {/* Award Level filter */}
              <select
                value={selectedAwardLevel}
                onChange={(e) => setSelectedAwardLevel(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-xl text-xs cursor-pointer light-input"
              >
                <option value="">ระดับเวทีทั้งหมด</option>
                <option value="National">ชาติ</option>
                <option value="International">นานาชาติ</option>
                <option value="Institutional">สถาบัน</option>
              </select>

              {/* Award Name filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-xl text-xs cursor-pointer light-input"
              >
                <option value="">รางวัลทั้งหมด</option>
                {getUniqueMetadataValues('award_name').map(aw => (
                  <option key={aw} value={aw}>{aw}</option>
                ))}
              </select>
            </>
          )}

          {activeCategory === 'utilization' && (
            <>
              {/* Utilization Type filter */}
              <select
                value={selectedUtType}
                onChange={(e) => setSelectedUtType(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-xl text-xs cursor-pointer light-input"
              >
                <option value="">ประเภทการใช้ประโยชน์ทั้งหมด</option>
                <option value="Public">ชุมชน/สาธารณะ</option>
                <option value="Policy">เชิงนโยบาย</option>
                <option value="Commercial">เชิงพาณิชย์</option>
                <option value="Academic">เชิงวิชาการ</option>
              </select>
            </>
          )}

          {/* Reset button */}
          <button
            onClick={handleResetFilters}
            className="p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#F0F7FF', color: '#0B1D3A', border: '1px solid #DAEEFF' }}
            title="ล้างตัวกรอง"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            รีเซ็ต
          </button>
        </div>

        {/* Counts */}
        <div className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.2)' }}>
          แสดง {sortedItems.length} / {items.length} รายการ
        </div>
      </div>

      {/* Content Table Area */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="spinner-teal mx-auto"></div>
          <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>กำลังโหลดรายการผลงาน...</p>
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="py-20 bg-white border border-slate-200 rounded-2xl text-center text-slate-500 text-xs font-semibold">
          ไม่พบข้อมูลผลงานในคลังหัวข้อนี้ตามตัวกรอง
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] text-xs">
            
            {/* Header Columns */}
            <thead>
              <tr className="text-white font-bold" style={{ background: '#0B1D3A' }}>
                {activeCategory === 'research' && (
                  <>
                    <th onClick={() => handleSort('year')} className="p-3.5 cursor-pointer select-none">ปี {renderSortIndicator('year')}</th>
                    <th className="p-3.5">#</th>
                    <th onClick={() => handleSort('title')} className="p-3.5 cursor-pointer select-none">ชื่อเรื่อง {renderSortIndicator('title')}</th>
                    <th onClick={() => handleSort('authors')} className="p-3.5 cursor-pointer select-none">นักวิจัย {renderSortIndicator('authors')}</th>
                    <th onClick={() => handleSort('contribution')} className="p-3.5 cursor-pointer select-none">บทบาท {renderSortIndicator('contribution')}</th>
                    <th onClick={() => handleSort('scope')} className="p-3.5 cursor-pointer select-none">ขอบเขต {renderSortIndicator('scope')}</th>
                    <th onClick={() => handleSort('funding')} className="p-3.5 cursor-pointer select-none">ทุนวิจัย {renderSortIndicator('funding')}</th>
                    <th onClick={() => handleSort('journal_rank')} className="p-3.5 cursor-pointer select-none">ฐาน {renderSortIndicator('journal_rank')}</th>
                    <th onClick={() => handleSort('journal_name')} className="p-3.5 cursor-pointer select-none">วารสาร {renderSortIndicator('journal_name')}</th>
                  </>
                )}

                {activeCategory === 'intellectual_property' && (
                  <>
                    <th className="p-3.5">#</th>
                    <th onClick={() => handleSort('title')} className="p-3.5 cursor-pointer select-none">ชื่อผลงาน {renderSortIndicator('title')}</th>
                    <th onClick={() => handleSort('authors')} className="p-3.5 cursor-pointer select-none">เจ้าของผลงานหลัก {renderSortIndicator('authors')}</th>
                    <th onClick={() => handleSort('ip_type')} className="p-3.5 cursor-pointer select-none">ประเภทของงาน {renderSortIndicator('ip_type')}</th>
                    <th onClick={() => handleSort('creator_type')} className="p-3.5 cursor-pointer select-none">ผู้สร้างสรรค์ {renderSortIndicator('creator_type')}</th>
                    <th onClick={() => handleSort('source')} className="p-3.5 cursor-pointer select-none">ที่มาของผลงาน {renderSortIndicator('source')}</th>
                    <th onClick={() => handleSort('export_date')} className="p-3.5 cursor-pointer select-none">วันที่ส่งออก {renderSortIndicator('export_date')}</th>
                    <th onClick={() => handleSort('application_status')} className="p-3.5 cursor-pointer select-none">สถานะเลขคำขอ {renderSortIndicator('application_status')}</th>
                    <th onClick={() => handleSort('registration_number')} className="p-3.5 cursor-pointer select-none">เลขที่คำขอ {renderSortIndicator('registration_number')}</th>
                    <th onClick={() => handleSort('status')} className="p-3.5 cursor-pointer select-none">สถานะปัจจุบัน {renderSortIndicator('status')}</th>
                  </>
                )}

                {activeCategory === 'innovation' && (
                  <>
                    <th onClick={() => handleSort('year')} className="p-3.5 cursor-pointer select-none">ปี {renderSortIndicator('year')}</th>
                    <th className="p-3.5">#</th>
                    <th onClick={() => handleSort('title')} className="p-3.5 cursor-pointer select-none">ชื่อผลงาน {renderSortIndicator('title')}</th>
                    <th onClick={() => handleSort('authors')} className="p-3.5 cursor-pointer select-none">เจ้าของผลงานหลัก {renderSortIndicator('authors')}</th>
                    <th onClick={() => handleSort('creator_type')} className="p-3.5 cursor-pointer select-none">ผู้สร้างสรรค์ {renderSortIndicator('creator_type')}</th>
                    <th onClick={() => handleSort('scope')} className="p-3.5 cursor-pointer select-none">ขอบเขตผลงาน {renderSortIndicator('scope')}</th>
                    <th onClick={() => handleSort('source')} className="p-3.5 cursor-pointer select-none">ที่มาของชิ้นงาน {renderSortIndicator('source')}</th>
                    <th onClick={() => handleSort('innovation_type')} className="p-3.5 cursor-pointer select-none">ประเภทของนวัตกรรม {renderSortIndicator('innovation_type')}</th>
                    <th onClick={() => handleSort('ip_status')} className="p-3.5 cursor-pointer select-none">ยื่นขอจดทรัพย์สินทางปัญญา {renderSortIndicator('ip_status')}</th>
                    <th onClick={() => handleSort('published')} className="p-3.5 cursor-pointer select-none">ตีพิมพ์ {renderSortIndicator('published')}</th>
                    <th onClick={() => handleSort('presented')} className="p-3.5 cursor-pointer select-none">นำเสนอผลงาน {renderSortIndicator('presented')}</th>
                  </>
                )}

                {activeCategory === 'award' && (
                  <>
                    <th onClick={() => handleSort('year')} className="p-3.5 cursor-pointer select-none">ปี {renderSortIndicator('year')}</th>
                    <th className="p-3.5">#</th>
                    <th onClick={() => handleSort('title')} className="p-3.5 cursor-pointer select-none">ชื่อผลงาน {renderSortIndicator('title')}</th>
                    <th onClick={() => handleSort('scope')} className="p-3.5 cursor-pointer select-none">ขอบเขตผลงาน {renderSortIndicator('scope')}</th>
                    <th onClick={() => handleSort('authors')} className="p-3.5 cursor-pointer select-none">เจ้าของผลงาน {renderSortIndicator('authors')}</th>
                    <th onClick={() => handleSort('presenter')} className="p-3.5 cursor-pointer select-none">ผู้นำเสนอ {renderSortIndicator('presenter')}</th>
                    <th onClick={() => handleSort('award_level')} className="p-3.5 cursor-pointer select-none">ระดับเวทีการนำเสนอ {renderSortIndicator('award_level')}</th>
                    <th onClick={() => handleSort('organizer')} className="p-3.5 cursor-pointer select-none">เวทีการนำเสนอ {renderSortIndicator('organizer')}</th>
                    <th onClick={() => handleSort('award_name')} className="p-3.5 cursor-pointer select-none">รางวัล {renderSortIndicator('award_name')}</th>
                  </>
                )}

                {activeCategory === 'utilization' && (
                  <>
                    <th onClick={() => handleSort('year')} className="p-3.5 cursor-pointer select-none">ปี {renderSortIndicator('year')}</th>
                    <th className="p-3.5">#</th>
                    <th onClick={() => handleSort('title')} className="p-3.5 cursor-pointer select-none">ผลงาน {renderSortIndicator('title')}</th>
                    <th onClick={() => handleSort('utilization_type')} className="p-3.5 cursor-pointer select-none">ประเภทผลงาน {renderSortIndicator('utilization_type')}</th>
                  </>
                )}
                <th className="p-3.5 text-center">Link</th>
              </tr>
            </thead>

            {/* Table Rows Body */}
            <tbody className="divide-y divide-slate-100">
              {sortedItems.map((item, idx) => {
                const isEven = idx % 2 === 0
                const rowBg = isEven ? 'bg-white' : 'bg-slate-50/50 hover:bg-slate-50'
                
                return (
                  <tr key={item.id} className={`${rowBg} hover:bg-[rgba(14,165,160,0.05)] transition-colors`}>
                    {activeCategory === 'research' && (
                      <>
                        <td className="p-3 font-mono font-semibold text-slate-500">{item.metadata?.year || '2569'}</td>
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-800 max-w-[280px] break-words">{item.title}</td>
                        <td className="p-3 font-medium text-slate-600">{item.authors || 'ไม่ระบุ'}</td>
                        <td className="p-3">
                          {item.metadata?.contribution && (
                            <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/50">
                              {item.metadata.contribution}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {item.metadata?.scope && (
                            <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                              {item.metadata.scope}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500">{item.metadata?.funding || 'ไม่มี'}</td>
                        <td className="p-3">
                          {item.metadata?.journal_rank && (
                            <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/50">
                              {item.metadata.journal_rank}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 italic max-w-[180px] truncate" title={item.metadata?.journal_name}>
                          {item.metadata?.journal_name || '-'}
                        </td>
                      </>
                    )}

                    {activeCategory === 'intellectual_property' && (
                      <>
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-800 max-w-[260px] break-words">{item.title}</td>
                        <td className="p-3 font-medium text-slate-600">{item.authors || 'ไม่ระบุ'}</td>
                        <td className="p-3">
                          <span className={`whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold ${item.metadata?.ip_type === 'PettyPatent' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-cyan-50 text-cyan-800 border border-cyan-200'}`}>
                            {item.metadata?.ip_type === 'PettyPatent' ? 'อนุสิทธิบัตร' : 'ลิขสิทธิ์'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{item.metadata?.creator_type || '-'}</td>
                        <td className="p-3 text-slate-500">{item.metadata?.source || '-'}</td>
                        <td className="p-3 font-mono text-slate-500">{formatExcelDate(item.metadata?.export_date)}</td>
                        <td className="p-3 text-slate-500">{item.metadata?.application_status || '-'}</td>
                        <td className="p-3 font-mono text-slate-500">{item.metadata?.registration_number || '-'}</td>
                        <td className="p-3">
                          {item.metadata?.status && (
                            <span className={`whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold ${item.metadata.status === 'รอพิจารณา' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {item.metadata.status}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {activeCategory === 'innovation' && (
                      <>
                        <td className="p-3 font-mono font-semibold text-slate-500">{item.metadata?.year || '2569'}</td>
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-800 max-w-[250px] break-words">{item.title}</td>
                        <td className="p-3 font-medium text-slate-600">{item.authors || 'ไม่ระบุ'}</td>
                        <td className="p-3 text-slate-500">{item.metadata?.creator_type || '-'}</td>
                        <td className="p-3 text-slate-500">
                          {item.metadata?.scope && (
                            <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {item.metadata.scope}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500">{item.metadata?.source || '-'}</td>
                        <td className="p-3 text-slate-500">{item.metadata?.innovation_type || '-'}</td>
                        <td className="p-3 text-slate-500">{item.metadata?.ip_status || '-'}</td>
                        <td className="p-3 text-slate-500">{item.metadata?.published || '-'}</td>
                        <td className="p-3 text-slate-500">{item.metadata?.presented || '-'}</td>
                      </>
                    )}

                    {activeCategory === 'award' && (
                      <>
                        <td className="p-3 font-mono font-semibold text-slate-500">{item.metadata?.year || '2569'}</td>
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-800 max-w-[250px] break-words">{item.title}</td>
                        <td className="p-3 text-slate-500">
                          {item.metadata?.scope && (
                            <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {item.metadata.scope}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-medium text-slate-600">{item.authors || 'ไม่ระบุ'}</td>
                        <td className="p-3 text-slate-500">{item.metadata?.presenter || '-'}</td>
                        <td className="p-3">
                          {item.metadata?.award_level && (
                            <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-150">
                              {item.metadata.award_level === 'National' ? 'ชาติ' : item.metadata.award_level === 'International' ? 'นานาชาติ' : 'สถาบัน'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 max-w-[200px] truncate" title={item.metadata?.organizer}>
                          {item.metadata?.organizer || '-'}
                        </td>
                        <td className="p-3">
                          {item.metadata?.award_name && (
                            <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                              🏆 {item.metadata.award_name}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {activeCategory === 'utilization' && (
                      <>
                        <td className="p-3 font-mono font-semibold text-slate-500">{item.metadata?.year || '2569'}</td>
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-800 max-w-[450px] break-words">{item.title}</td>
                        <td className="p-3">
                          {item.metadata?.utilization_type && (
                            <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {item.metadata.utilization_type === 'Public' ? 'ชุมชน/สาธารณะ' : item.metadata.utilization_type === 'Policy' ? 'เชิงนโยบาย' : item.metadata.utilization_type === 'Commercial' ? 'เชิงพาณิชย์' : 'เชิงวิชาการ'}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Action Column */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="whitespace-nowrap px-2.5 py-1 rounded bg-slate-50 border border-slate-200 hover:border-blue-900 text-slate-600 hover:text-blue-900 font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-sm text-[10px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        เปิดดู
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>

          </table>
        </div>
      )}

      {/* Detail Modal - Pure light sheet design */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start shrink-0">
              <div>
                <span className="eyebrow-badge">
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
              
              {/* Author & Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,160,0.12)' }}>👤</span>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">คณะผู้จัดทำ</div>
                    <div className="text-xs text-slate-800 font-semibold">{selectedItem.authors || 'ไม่ระบุ'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,160,0.12)' }}>📅</span>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">วันที่บันทึกระบบ</div>
                    <div className="text-xs text-slate-800 font-semibold font-mono">
                      {new Date(selectedItem.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {selectedItem.metadata?.department && (
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,160,0.12)' }}>🏫</span>
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">สาขาวิชา/หน่วยงาน</div>
                      <div className="text-xs text-slate-800 font-semibold">{getDeptOptionLabel(selectedItem.metadata.department)}</div>
                    </div>
                  </div>
                )}

                {/* Subtype metadata fields */}
                {Object.entries(selectedItem.metadata || {}).map(([key, val]) => {
                  if (key === 'department' || !val) return null
                  const labelMap: Record<string, string> = {
                    research_type: 'ประเภทงานวิจัย',
                    ip_type: 'ประเภททรัพย์สินทางปัญญา',
                    award_level: 'ระดับรางวัลเชิดชูเกียรติ',
                    utilization_type: 'ประเภทการใช้ประโยชน์',
                    journal_name: 'ตีพิมพ์ในวารสาร',
                    registration_number: 'เลขทะเบียนเอกสารสิทธิ์ / เลขที่คำขอ',
                    registration_date: 'วันที่จดทะเบียนสิทธิ์',
                    organizer: 'หน่วยงานผู้มอบ/เวทีการนำเสนอ',
                    organization_used: 'หน่วยงานที่อ้างอิงนำไปใช้',
                    impact_summary: 'ประโยชน์เชิงประจักษ์',
                    year: 'ปีจัดทำ/ปีงบประมาณ',
                    scope: 'ขอบเขตของผลงาน',
                    creator_type: 'กลุ่มผู้สร้างสรรค์',
                    source: 'ที่มาของผลงาน',
                    ip_subtype: 'ประเภททรัพย์สินทางปัญญาย่อย',
                    export_date: 'วันที่ส่งออกเอกสาร',
                    application_status: 'สถานะเลขคำขอ',
                    status: 'สถานะการยื่นขอสิทธิ์ปัจจุบัน',
                    contribution: 'การมีส่วนร่วมในผลงาน',
                    funding: 'ทุนวิจัยที่ได้รับ',
                    journal_rank: 'ระดับฐานข้อมูลวารสาร',
                    presenter: 'ผู้นำเสนอผลงาน',
                    award_name: 'รางวัลที่ได้รับ',
                    innovation_type: 'ประเภทนวัตกรรม',
                    ip_status: 'การยื่นขอทรัพย์สินทางปัญญา',
                    published: 'การตีพิมพ์เผยแพร่',
                    presented: 'การนำเสนอผลงานวิชาการ',
                    drive_link: 'ลิงก์ไดรฟ์รายละเอียดผลงาน',
                  }
                  
                  const label = labelMap[key] || key
                  let displayVal = val as string
                  if (key.endsWith('_type') || key === 'award_level') {
                    displayVal = getSubtypeOptionLabel(selectedItem.category, val as string)
                  } else if (key === 'export_date' && val && !isNaN(Number(val))) {
                    const excelSerial = Number(val)
                    const date = new Date((excelSerial - 25569) * 86400 * 1000)
                    if (!isNaN(date.getTime())) {
                      displayVal = date.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    }
                  }

                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,160,0.12)' }}>📄</span>
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
                <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'rgba(14,165,160,0.15)', color: '#0EA5A0' }}>
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
                      className="btn-primary text-xs flex items-center gap-1.5 !py-2 !px-4"
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
                        className="btn-primary text-xs flex items-center gap-1.5 !py-2 !px-4"
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
                      🔒 ล็อกอินก่อนเพื่อรับสิทธิ์ดาวน์โหลด
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
