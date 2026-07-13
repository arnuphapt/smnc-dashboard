import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useLookups } from '../context/LookupContext'
import { useAuth } from '../context/AuthContext'
import { FileText, Download, X, FileCheck, Eye } from 'lucide-react'
import { WisdomItem } from './Dashboard'
import { formatExcelDate } from '../utils/format'
import { DataTable, DataTableColumn } from '../components/DataTable'
import { FilterBar, FilterBarSelect } from '../components/FilterBar'
import { Breadcrumbs } from '../components/Breadcrumbs'

const VALID_CATEGORIES = ['research', 'innovation', 'intellectual_property', 'award', 'utilization']

export const Repositories: React.FC = () => {
  const { user } = useAuth()
  const { getOptionsByCategory } = useLookups()
  const { category } = useParams<{ category: string }>()

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
    return list.find(o => o.value === value)?.value || value
  }

  const getDeptOptionLabel = (value: string) => {
    const list = getOptionsByCategory('department')
    return list.find(o => o.value === value)?.value || value
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

  const linkColumn: DataTableColumn<WisdomItem> = {
    key: '__link',
    header: 'Link',
    align: 'center',
    render: (item) => (
      <button
        onClick={() => handleOpenDetail(item)}
        className="whitespace-nowrap px-2.5 py-1 rounded bg-slate-50 border border-slate-200 hover:border-blue-900 text-slate-600 hover:text-blue-900 font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-sm text-[10px]"
      >
        <Eye className="w-3.5 h-3.5" />
        เปิดดู
      </button>
    ),
  }

  const getColumns = (): DataTableColumn<WisdomItem>[] => {
    if (activeCategory === 'research') {
      return [
        { key: 'year', header: 'ปี', sortable: true, render: (item) => <span className="font-mono font-semibold text-slate-500">{item.metadata?.year || '2569'}</span> },
        { key: 'title', header: 'ชื่อเรื่อง', sortable: true, render: (item) => <span className="font-semibold text-slate-800 max-w-[280px] break-words block">{item.title}</span> },
        { key: 'authors', header: 'นักวิจัย', sortable: true, render: (item) => <span className="font-medium text-slate-600">{item.authors || 'ไม่ระบุ'}</span> },
        { key: 'contribution', header: 'บทบาท', sortable: true, render: (item) => item.metadata?.contribution && (
          <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/50">{item.metadata.contribution}</span>
        ) },
        { key: 'scope', header: 'ขอบเขต', sortable: true, render: (item) => item.metadata?.scope && (
          <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">{item.metadata.scope}</span>
        ) },
        { key: 'funding', header: 'ทุนวิจัย', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.funding || 'ไม่มี'}</span> },
        { key: 'journal_rank', header: 'ฐาน', sortable: true, render: (item) => item.metadata?.journal_rank && (
          <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/50">{item.metadata.journal_rank}</span>
        ) },
        { key: 'journal_name', header: 'วารสาร', sortable: true, render: (item) => (
          <span className="text-slate-500 italic max-w-[180px] truncate block" title={item.metadata?.journal_name}>{item.metadata?.journal_name || '-'}</span>
        ) },
        linkColumn,
      ]
    }

    if (activeCategory === 'intellectual_property') {
      return [
        { key: 'title', header: 'ชื่อผลงาน', sortable: true, render: (item) => <span className="font-semibold text-slate-800 max-w-[260px] break-words block">{item.title}</span> },
        { key: 'authors', header: 'เจ้าของผลงานหลัก', sortable: true, render: (item) => <span className="font-medium text-slate-600">{item.authors || 'ไม่ระบุ'}</span> },
        { key: 'ip_type', header: 'ประเภทของงาน', sortable: true, render: (item) => item.metadata?.ip_type && (
          <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
            {item.metadata.ip_type}
          </span>
        ) },
        { key: 'scope', header: 'ขอบเขตผลงาน', sortable: true, render: (item) => item.metadata?.scope && (
          <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{item.metadata.scope}</span>
        ) },
        { key: 'creator_type', header: 'ผู้สร้างสรรค์', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.creator_type || '-'}</span> },
        { key: 'source', header: 'ที่มาของผลงาน', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.source || '-'}</span> },
        { key: 'export_date', header: 'วันที่ส่งออก', sortable: true, render: (item) => <span className="font-mono text-slate-500">{formatExcelDate(item.metadata?.export_date)}</span> },
        { key: 'application_status', header: 'สถานะเลขคำขอ', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.application_status || '-'}</span> },
        { key: 'registration_number', header: 'เลขที่คำขอ', sortable: true, render: (item) => <span className="font-mono text-slate-500">{item.metadata?.registration_number || '-'}</span> },
        { key: 'patent_number', header: 'เลขที่อนุสิทธิบัตร/สิทธิบัตร', sortable: true, render: (item) => <span className="font-mono text-slate-500">{item.metadata?.patent_number || '-'}</span> },
        { key: 'status', header: 'สถานะปัจจุบัน', sortable: true, render: (item) => item.metadata?.status && (
          <span className={`whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold ${item.metadata.status === 'รอพิจารณา' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {item.metadata.status}
          </span>
        ) },
        linkColumn,
      ]
    }

    if (activeCategory === 'innovation') {
      return [
        { key: 'year', header: 'ปี', sortable: true, render: (item) => <span className="font-mono font-semibold text-slate-500">{item.metadata?.year || '2569'}</span> },
        { key: 'title', header: 'ชื่อผลงาน', sortable: true, render: (item) => <span className="font-semibold text-slate-800 max-w-[250px] break-words block">{item.title}</span> },
        { key: 'authors', header: 'เจ้าของผลงานหลัก', sortable: true, render: (item) => <span className="font-medium text-slate-600">{item.authors || 'ไม่ระบุ'}</span> },
        { key: 'creator_type', header: 'ผู้สร้างสรรค์', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.creator_type || '-'}</span> },
        { key: 'scope', header: 'ขอบเขตผลงาน', sortable: true, render: (item) => item.metadata?.scope && (
          <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{item.metadata.scope}</span>
        ) },
        { key: 'source', header: 'ที่มาของชิ้นงาน', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.source || '-'}</span> },
        { key: 'innovation_type', header: 'ประเภทของนวัตกรรม', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.innovation_type || '-'}</span> },
        { key: 'ip_status', header: 'ยื่นขอจดทรัพย์สินทางปัญญา', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.ip_status || '-'}</span> },
        { key: 'award_name', header: 'รางวัลที่ได้รับ', sortable: true, render: (item) => item.metadata?.award_name && (
          <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">🏆 {item.metadata.award_name}</span>
        ) },
        { key: 'published', header: 'ตีพิมพ์', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.published || '-'}</span> },
        { key: 'presented', header: 'นำเสนอผลงาน', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.presented || '-'}</span> },
        linkColumn,
      ]
    }

    if (activeCategory === 'award') {
      return [
        { key: 'year', header: 'ปี', sortable: true, render: (item) => <span className="font-mono font-semibold text-slate-500">{item.metadata?.year || '2569'}</span> },
        { key: 'title', header: 'ชื่อผลงาน', sortable: true, render: (item) => <span className="font-semibold text-slate-800 max-w-[250px] break-words block">{item.title}</span> },
        { key: 'scope', header: 'ขอบเขตผลงาน', sortable: true, render: (item) => item.metadata?.scope && (
          <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{item.metadata.scope}</span>
        ) },
        { key: 'authors', header: 'เจ้าของผลงาน', sortable: true, render: (item) => <span className="font-medium text-slate-600">{item.authors || 'ไม่ระบุ'}</span> },
        { key: 'presenter', header: 'ผู้นำเสนอ', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.presenter || '-'}</span> },
        { key: 'award_level', header: 'ระดับเวทีการนำเสนอ', sortable: true, render: (item) => item.metadata?.award_level && (
          <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-150">
            {item.metadata.award_level}
          </span>
        ) },
        { key: 'organizer', header: 'เวทีการนำเสนอ', sortable: true, render: (item) => (
          <span className="text-slate-500 max-w-[200px] truncate block" title={item.metadata?.organizer}>{item.metadata?.organizer || '-'}</span>
        ) },
        { key: 'award_name', header: 'รางวัล', sortable: true, render: (item) => item.metadata?.award_name && (
          <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">🏆 {item.metadata.award_name}</span>
        ) },
        linkColumn,
      ]
    }

    // utilization
    return [
      { key: 'year', header: 'ปี', sortable: true, render: (item) => <span className="font-mono font-semibold text-slate-500">{item.metadata?.year || '2569'}</span> },
      { key: 'title', header: 'ผลงาน', sortable: true, render: (item) => <span className="font-semibold text-slate-800 max-w-[450px] break-words block">{item.title}</span> },
      { key: 'authors', header: 'เจ้าของผลงาน', sortable: true, render: (item) => <span className="font-medium text-slate-600">{item.authors || 'ไม่ระบุ'}</span> },
      { key: 'utilization_type', header: 'ประเภทผลงาน', sortable: true, render: (item) => item.metadata?.utilization_type && (
        <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          {item.metadata.utilization_type}
        </span>
      ) },
      { key: 'organization_used', header: 'หน่วยงานที่นำไปใช้ประโยชน์', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.organization_used || '-'}</span> },
      { key: 'utilization_date', header: 'วันที่ขอนำไปใช้ประโยชน์', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.utilization_date || '-'}</span> },
      linkColumn,
    ]
  }

  const getFilters = (): FilterBarSelect[] => {
    const common: FilterBarSelect[] = [
      {
        key: 'year',
        value: selectedYear,
        onChange: setSelectedYear,
        placeholder: 'ปีทั้งหมด',
        options: getUniqueMetadataValues('year').map((yr) => ({ value: yr, label: yr })),
      },
      {
        key: 'author',
        value: selectedAuthor,
        onChange: setSelectedAuthor,
        placeholder: 'นักวิจัยทั้งหมด',
        options: getUniqueAuthors().map((auth) => ({ value: auth, label: auth })),
        className: 'max-w-[150px] truncate',
      },
    ]

    if (activeCategory === 'research') {
      return [
        ...common,
        {
          key: 'scope',
          value: selectedScope,
          onChange: setSelectedScope,
          placeholder: 'ขอบเขตทั้งหมด',
          options: getUniqueMetadataValues('scope').map((s) => ({ value: s, label: s })),
        },
        {
          key: 'rank',
          value: selectedRank,
          onChange: setSelectedRank,
          placeholder: 'ระดับฐานทั้งหมด',
          options: getUniqueMetadataValues('journal_rank').map((r) => ({ value: r, label: r })),
        },
      ]
    }

    if (activeCategory === 'intellectual_property') {
      return [
        ...common,
        {
          key: 'ip_type',
          value: selectedIpType,
          onChange: setSelectedIpType,
          placeholder: 'ประเภทสิทธิ์ทั้งหมด',
          options: getUniqueMetadataValues('ip_type').map((v) => ({ value: v, label: v })),
        },
        {
          key: 'status',
          value: selectedStatus,
          onChange: setSelectedStatus,
          placeholder: 'สถานะทั้งหมด',
          options: getUniqueMetadataValues('status').map((st) => ({ value: st, label: st })),
        },
      ]
    }

    if (activeCategory === 'innovation') {
      return [
        ...common,
        {
          key: 'creator_type',
          value: selectedCreatorType,
          onChange: setSelectedCreatorType,
          placeholder: 'ผู้สร้างสรรค์ทั้งหมด',
          options: getUniqueMetadataValues('creator_type').map((ct) => ({ value: ct, label: ct })),
        },
        {
          key: 'innovation_type',
          value: selectedInnoType,
          onChange: setSelectedInnoType,
          placeholder: 'ประเภทนวัตกรรมทั้งหมด',
          options: getUniqueMetadataValues('innovation_type').map((it) => ({ value: it, label: it })),
        },
      ]
    }

    if (activeCategory === 'award') {
      return [
        ...common,
        {
          key: 'award_level',
          value: selectedAwardLevel,
          onChange: setSelectedAwardLevel,
          placeholder: 'ระดับเวทีทั้งหมด',
          options: getUniqueMetadataValues('award_level').map((v) => ({ value: v, label: v })),
        },
        {
          key: 'award_name',
          value: selectedStatus,
          onChange: setSelectedStatus,
          placeholder: 'รางวัลทั้งหมด',
          options: getUniqueMetadataValues('award_name').map((aw) => ({ value: aw, label: aw })),
        },
      ]
    }

    // utilization
    return [
      ...common,
      {
        key: 'utilization_type',
        value: selectedUtType,
        onChange: setSelectedUtType,
        placeholder: 'ประเภทการใช้ประโยชน์ทั้งหมด',
        options: getUniqueMetadataValues('utilization_type').map((v) => ({ value: v, label: v })),
      },
    ]
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
    { id: 'research', label: 'คลังผลงานวิจัย' },
    { id: 'intellectual_property', label: 'คลังทรัพย์สินทางปัญญา' },
    { id: 'innovation', label: 'คลังนวัตกรรม' },
    { id: 'award', label: 'คลังรางวัลและความสำเร็จ' },
    { id: 'utilization', label: 'การนำไปใช้ประโยชน์' },
  ]

  const categoryMeta: Record<string, { label: string; subtitle: string }> = {
    research: { label: 'คลังผลงานวิจัย', subtitle: 'Research Repository' },
    intellectual_property: { label: 'คลังทรัพย์สินทางปัญญา', subtitle: 'Intellectual Property' },
    innovation: { label: 'คลังนวัตกรรม', subtitle: 'Innovation Repository' },
    award: { label: 'คลังรางวัลและความสำเร็จ', subtitle: 'Awards & Recognition' },
    utilization: { label: 'การนำไปใช้ประโยชน์', subtitle: 'Research Utilization' },
  }
  const currentMeta = categoryMeta[activeCategory] ?? { label: 'คลังปัญญา 5 ด้าน', subtitle: 'Wisdom Repositories' }
  const categoryRecordCode: Record<string, string> = {
    research: 'RES-01',
    intellectual_property: 'IPR-02',
    innovation: 'INV-03',
    award: 'AWD-04',
    utilization: 'UTL-05',
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs />
      
      {/* Page Header — plain heading + description, no card */}
      <div className="page-header-band">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: '#64748B' }}>
            SMNC · Knowledge Repository
          </span>
          <span className="record-tag shrink-0">REC · {categoryRecordCode[activeCategory] || 'RES-01'}</span>
        </div>
        <h1 className="header-display text-[1.75rem] font-bold leading-tight mt-2 mb-1" style={{ color: '#0B1D3A' }}>
          {currentMeta.label}
        </h1>
        <p className="text-sm font-medium" style={{ color: '#64748B' }}>
          {currentMeta.subtitle} — ค้นหา กรอง และเข้าถึงผลงานได้แบบเรียลไทม์
        </p>
      </div>

      {/* Dynamic Filters Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ชื่อเรื่อง, นักวิจัย, วารสาร..."
        filters={getFilters()}
        onReset={handleResetFilters}
        resultCount={sortedItems.length}
        totalCount={items.length}
      />

      {/* Content Table Area */}
      <DataTable
        columns={getColumns()}
        data={sortedItems}
        getRowKey={(item) => item.id}
        loading={loading}
        loadingLabel="กำลังโหลดรายการผลงาน..."
        headerVariant="navy"
        sortField={sortField}
        sortAsc={sortAsc}
        onSortChange={handleSort}
        resetKey={`${activeCategory}|${search}|${selectedYear}|${selectedAuthor}|${selectedScope}|${selectedRank}|${selectedStatus}|${selectedIpType}|${selectedCreatorType}|${selectedInnoType}|${selectedAwardLevel}|${selectedUtType}|${showOnlyPublic}`}
        empty={{
          icon: <FileCheck className="w-10 h-10 stroke-[1.5]" />,
          title: 'ไม่พบข้อมูลผลงานในคลังหัวข้อนี้ตามตัวกรอง',
        }}
      />

      {/* Detail Modal - Pure light sheet design */}
      {selectedItem && createPortal(
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
        </div>,
        document.body
      )}
    </div>
  )
}
