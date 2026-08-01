'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMasters } from '@/context/MasterContext'
import { useAuth } from '@/context/AuthContext'

const supabase = createClient()
import { FileText, Download, X, FileCheck, Eye, FileDown, User, Calendar, Building2, Tag, Award, BookOpen, Globe, Bookmark } from 'lucide-react'
import { WisdomItem } from './Dashboard'
import { formatExcelDate } from '@/utils/format'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { FilterBar, FilterBarSelect } from '@/components/FilterBar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { exportItemToWord, exportCategoryReportToWord } from '@/utils/wordExport'
import { formatAuthorsForDisplay } from '@/utils/authorHelper'

const VALID_CATEGORIES = ['research', 'innovation', 'intellectual_property', 'award', 'utilization']

export const Repositories: React.FC = () => {
  const { user } = useAuth()
  const { getOptionsByCategory } = useMasters()
  const { category } = useParams<{ category: string }>()

  const activeCategory = category && VALID_CATEGORIES.includes(category) ? category : 'research'
  const [items, setItems] = useState<WisdomItem[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
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

  const fetchProfiles = async () => {
    try {
      const { data } = await supabase.from('profiles').select('email, full_name')
      if (data) setProfiles(data)
    } catch (err) {
      console.error('Error fetching profiles:', err)
    }
  }

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
    fetchProfiles()

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
    key: '__actions',
    header: 'จัดการ',
    align: 'right',
    render: (item) => (
      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
        <button
          onClick={() => handleOpenDetail(item)}
          className="px-3.5 py-1.5 rounded-full bg-[#F0F7FF] border border-[#DAEEFF] hover:bg-[#E0F2FE] text-[#00796B] font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-xs"
        >
          <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
          เปิดดู
        </button>
        <button
          onClick={() => exportItemToWord(item, currentMeta.label)}
          className="px-3.5 py-1.5 rounded-full bg-[#F0F7FF] border border-[#DAEEFF] hover:bg-[#E0F2FE] text-[#00796B] font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-xs"
          title="ออกรายงาน Word (.doc) รายการนี้"
        >
          <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
          รายงาน Word
        </button>
      </div>
    ),
  }

  const getColumns = (): DataTableColumn<WisdomItem>[] => {
    if (activeCategory === 'research') {
      return [
        { key: 'year', header: 'ปี', sortable: true, render: (item) => <span className="font-mono font-semibold text-slate-500">{item.metadata?.year || '2569'}</span> },
        { key: 'title', header: 'ชื่อเรื่อง', sortable: true, render: (item) => <span className="font-semibold text-slate-800 min-w-[220px] max-w-[380px] break-words block">{item.title}</span> },
        { key: 'authors', header: 'นักวิจัย', sortable: true, render: (item) => <span className="font-medium text-slate-600">{formatAuthorsForDisplay(item.authors, profiles) || 'ไม่ระบุ'}</span> },
        { key: 'scope', header: 'ขอบเขต', sortable: true, render: (item) => item.metadata?.scope ? <StatusBadge status={item.metadata.scope} size="sm" /> : <span className="text-slate-400 font-medium">-</span> },
        { key: 'funding', header: 'ทุนวิจัย', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.funding || 'ไม่มี'}</span> },
        { key: 'journal_rank', header: 'ฐาน', sortable: true, render: (item) => item.metadata?.journal_rank ? <StatusBadge status={item.metadata.journal_rank} size="sm" /> : <span className="text-slate-400 font-medium">-</span> },
        { key: 'journal_name', header: 'วารสาร', sortable: true, render: (item) => (
          <span className="text-slate-500 italic max-w-[180px] truncate block" title={item.metadata?.journal_name}>{item.metadata?.journal_name || '-'}</span>
        ) },
        linkColumn,
      ]
    }

    if (activeCategory === 'intellectual_property') {
      return [
        { key: 'title', header: 'ชื่อผลงาน', sortable: true, render: (item) => <span className="font-semibold text-slate-800 min-w-[220px] max-w-[380px] break-words block">{item.title}</span> },
        { key: 'authors', header: 'เจ้าของผลงานหลัก', sortable: true, render: (item) => <span className="font-medium text-slate-600">{formatAuthorsForDisplay(item.authors, profiles) || 'ไม่ระบุ'}</span> },
        { key: 'ip_type', header: 'ประเภทของงาน', sortable: true, render: (item) => item.metadata?.ip_type ? <StatusBadge status={item.metadata.ip_type} size="sm" /> : <span className="text-slate-400 font-medium">-</span> },
        { key: 'scope', header: 'ขอบเขตผลงาน', sortable: true, render: (item) => item.metadata?.scope ? <StatusBadge status={item.metadata.scope} size="sm" /> : <span className="text-slate-400 font-medium">-</span> },
        { key: 'creator_type', header: 'ผู้สร้างสรรค์', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.creator_type || '-'}</span> },
        { key: 'source', header: 'ที่มาของผลงาน', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.source || '-'}</span> },
        { key: 'registration_date', header: 'วันที่ส่งออก', sortable: true, render: (item) => <span className="font-mono text-slate-500">{item.metadata?.registration_date || '-'}</span> },
        { key: 'application_status', header: 'สถานะเลขคำขอ', sortable: true, render: (item) => item.metadata?.application_status ? <StatusBadge status={item.metadata.application_status} size="sm" /> : <span className="text-slate-400 font-medium">-</span> },
        { key: 'registration_number', header: 'เลขที่คำขอ', sortable: true, render: (item) => <span className="font-mono text-slate-500">{item.metadata?.registration_number || '-'}</span> },
        { key: 'patent_number', header: 'เลขที่อนุสิทธิบัตร/สิทธิบัตร', sortable: true, render: (item) => <span className="font-mono text-slate-500">{item.metadata?.patent_number || '-'}</span> },
        { key: 'status', header: 'สถานะปัจจุบัน', sortable: true, render: (item) => item.metadata?.status ? <StatusBadge status={item.metadata.status} size="sm" /> : <span className="text-slate-400 font-medium">-</span> },
        linkColumn,
      ]
    }

    if (activeCategory === 'innovation') {
      return [
        { key: 'year', header: 'ปี', sortable: true, render: (item) => <span className="font-mono font-semibold text-slate-500">{item.metadata?.year || '2569'}</span> },
        { key: 'title', header: 'ชื่อผลงาน', sortable: true, render: (item) => <span className="font-semibold text-slate-800 min-w-[220px] max-w-[380px] break-words block">{item.title}</span> },
        { key: 'authors', header: 'เจ้าของผลงานหลัก', sortable: true, render: (item) => <span className="font-medium text-slate-600">{formatAuthorsForDisplay(item.authors, profiles) || 'ไม่ระบุ'}</span> },
        { key: 'creator_type', header: 'ผู้สร้างสรรค์', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.creator_type || '-'}</span> },
        { key: 'scope', header: 'ขอบเขตผลงาน', sortable: true, render: (item) => item.metadata?.scope ? <StatusBadge status={item.metadata.scope} size="sm" /> : <span className="text-slate-400 font-medium">-</span> },
        { key: 'source', header: 'ที่มาของชิ้นงาน', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.source || '-'}</span> },
        { key: 'innovation_type', header: 'ประเภทของนวัตกรรม', sortable: true, render: (item) => item.metadata?.innovation_type ? <StatusBadge status={item.metadata.innovation_type} size="sm" /> : <span className="text-slate-400 font-medium">-</span> },
        { key: 'ip_status', header: 'ยื่นขอจดทรัพย์สินทางปัญญา', sortable: true, render: (item) => item.metadata?.ip_status ? <StatusBadge status={item.metadata.ip_status} size="sm" /> : <span className="text-slate-400 font-medium">-</span> },
        { key: 'award_name', header: 'รางวัลที่ได้รับ', sortable: true, render: (item) => item.metadata?.award_name && (
          <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1 shadow-2xs">🏆 {item.metadata.award_name}</span>
        ) },
        { key: 'published', header: 'ตีพิมพ์', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.published || '-'}</span> },
        { key: 'presented', header: 'นำเสนอผลงาน', sortable: true, render: (item) => <span className="text-slate-500">{item.metadata?.presented || '-'}</span> },
        linkColumn,
      ]
    }

    if (activeCategory === 'award') {
      return [
        { key: 'year', header: 'ปี', sortable: true, render: (item) => <span className="font-mono font-semibold text-slate-500 min-w-[48px] block">{item.metadata?.year || '2569'}</span> },
        { key: 'title', header: 'ชื่อผลงาน', sortable: true, render: (item) => <span className="font-semibold text-slate-800 min-w-[220px] max-w-[380px] break-words block">{item.title}</span> },
        { key: 'scope', header: 'ขอบเขตผลงาน', sortable: true, render: (item) => item.metadata?.scope ? <StatusBadge status={item.metadata.scope} size="sm" /> : <span className="text-slate-400 font-medium">-</span> },
        { key: 'authors', header: 'เจ้าของผลงาน', sortable: true, render: (item) => <span className="font-medium text-slate-600 min-w-[160px] max-w-[240px] break-words block">{formatAuthorsForDisplay(item.authors, profiles) || 'ไม่ระบุ'}</span> },
        { key: 'award_level', header: 'ระดับเวทีการนำเสนอ', sortable: true, render: (item) => <div className="min-w-[120px]">{item.metadata?.award_level ? <StatusBadge status={item.metadata.award_level} size="sm" /> : <span className="text-slate-400 font-medium">-</span>}</div> },
        { key: 'organizer', header: 'รายละเอียดเวทีการนำเสนอ', sortable: true, render: (item) => (
          <span className="text-slate-500 min-w-[200px] max-w-[300px] break-words block" title={item.metadata?.organizer}>{item.metadata?.organizer || '-'}</span>
        ) },
        { key: 'award_name', header: 'รางวัล', sortable: true, render: (item) => <div className="min-w-[140px]">{item.metadata?.award_name ? (
          <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1 shadow-2xs">🏆 {item.metadata.award_name}</span>
        ) : <span className="text-slate-400 font-medium">-</span>}</div> },
        linkColumn,
      ]
    }

    // utilization
    return [
      { key: 'year', header: 'ปี', sortable: true, render: (item) => <span className="font-mono font-semibold text-slate-500">{item.metadata?.year || '2569'}</span> },
      { key: 'title', header: 'ผลงาน', sortable: true, render: (item) => <span className="font-semibold text-slate-800 max-w-[450px] break-words block">{item.title}</span> },
      { key: 'authors', header: 'เจ้าของผลงาน', sortable: true, render: (item) => <span className="font-medium text-slate-600">{formatAuthorsForDisplay(item.authors, profiles) || 'ไม่ระบุ'}</span> },
      { key: 'utilization_type', header: 'ประเภทผลงาน', sortable: true, render: (item) => item.metadata?.utilization_type ? <StatusBadge status={item.metadata.utilization_type} size="sm" /> : <span className="text-slate-400 font-medium">-</span> },
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
      {/* Page Header */}
      <PageHeader
        title={currentMeta.label}
        subtitle={`${currentMeta.subtitle} — ค้นหา กรอง และเข้าถึงผลงานได้แบบเรียลไทม์`}
        extraBadge="Knowledge Repository"
        action={
          <button
            onClick={() => exportCategoryReportToWord(currentMeta.label, sortedItems)}
            className="btn-gold text-xs flex items-center gap-2 !py-2.5 !px-5 shrink-0 cursor-pointer self-start md:self-auto"
          >
            <FileDown className="w-4 h-4 stroke-[2.5]" />
            ออกรายงาน Word สรุปสถิติ
          </button>
        }
      />

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
        headerVariant="frost"
        sortField={sortField}
        sortAsc={sortAsc}
        onSortChange={handleSort}
        resetKey={`${activeCategory}|${search}|${selectedYear}|${selectedAuthor}|${selectedScope}|${selectedRank}|${selectedStatus}|${selectedIpType}|${selectedCreatorType}|${selectedInnoType}|${selectedAwardLevel}|${selectedUtType}|${showOnlyPublic}`}
        empty={{
          icon: <FileCheck className="w-10 h-10 stroke-[1.5]" />,
          title: 'ไม่พบข้อมูลผลงานในคลังหัวข้อนี้ตามตัวกรอง',
        }}
      />

      {/* Detail Modal - High-end intentionally designed sheet */}
      {selectedItem && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 relative bg-gradient-to-r from-slate-50 via-white to-teal-50/20">
              <div className="space-y-1.5 pr-6">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/10 text-teal-700 border border-teal-500/20">
                    <Bookmark className="w-3 h-3 text-teal-600" />
                    {categories.find(c => c.id === selectedItem.category)?.label}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    ID: {selectedItem.id.substring(0, 8)}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 leading-snug tracking-tight pt-1">
                  {selectedItem.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed text-slate-700">
              
              {/* Main Image if available */}
              {selectedItem.image_url && (
                <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900/5 flex items-center justify-center p-3 max-h-72 shadow-inner">
                  <img
                    src={getMediaUrl(selectedItem.image_url, selectedItem.is_public)}
                    alt={selectedItem.title}
                    className="w-full max-h-64 object-contain rounded-xl shadow-sm"
                  />
                </div>
              )}

              {/* Attributes Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Author Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 flex items-start gap-3 transition-all hover:bg-slate-50">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: 'rgba(14,165,160,0.12)', color: '#0EA5A0' }}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">คณะผู้จัดทำ / เจ้าของผลงาน</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.authors || 'ไม่ระบุ'}</div>
                  </div>
                </div>

                {/* Date Created Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 flex items-start gap-3 transition-all hover:bg-slate-50">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: 'rgba(14,165,160,0.12)', color: '#0EA5A0' }}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">วันที่บันทึกระบบ</div>
                    <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                      {new Date(selectedItem.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Department Card if present */}
                {selectedItem.metadata?.department && (
                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 flex items-start gap-3 transition-all hover:bg-slate-50">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: 'rgba(14,165,160,0.12)', color: '#0EA5A0' }}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">สาขาวิชา / หน่วยงาน</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">{getDeptOptionLabel(selectedItem.metadata.department)}</div>
                    </div>
                  </div>
                )}

                {/* Dynamic Metadata Attributes Cards */}
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
                    organizer: 'รายละเอียดเวทีการนำเสนอ',
                    organization_used: 'หน่วยงานที่อ้างอิงนำไปใช้',
                    impact_summary: 'ประโยชน์เชิงประจักษ์',
                    year: 'ปี',
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

                  // Pick appropriate icon based on key
                  let IconComponent = Tag
                  if (key === 'year' || key.includes('date')) IconComponent = Calendar
                  else if (key.includes('award')) IconComponent = Award
                  else if (key.includes('journal')) IconComponent = BookOpen
                  else if (key === 'scope') IconComponent = Globe

                  return (
                    <div key={key} className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 flex items-start gap-3 transition-all hover:bg-slate-50">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: 'rgba(14,165,160,0.12)', color: '#0EA5A0' }}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</div>
                        <div className="text-xs font-bold text-slate-800 mt-1">
                          {['status', 'application_status', 'ip_status', 'contribution', 'scope', 'journal_rank', 'ip_type', 'award_level', 'utilization_type', 'innovation_type'].includes(key) ? (
                            <StatusBadge status={displayVal} size="sm" />
                          ) : (
                            displayVal
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Download File Attachment Card if file_url present */}
              {selectedItem.file_url && (
                <div className="p-4 rounded-2xl flex items-center justify-between gap-3 border" style={{ background: '#F0F7FF', borderColor: '#DAEEFF' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0" style={{ background: 'rgba(14,165,160,0.15)', color: '#0EA5A0' }}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">เอกสารแนบประจำผลงาน</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {selectedItem.is_public ? 'แฟ้มเอกสารเปิดเผยทั่วไป (Public)' : 'แฟ้มเอกสารเฉพาะบุคคลที่ล็อกอินในระบบสถาบัน (Private)'}
                      </div>
                    </div>
                  </div>

                  {selectedItem.is_public ? (
                    <a
                      href={getMediaUrl(selectedItem.file_url, true)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs flex items-center gap-1.5 !py-2 !px-4 shrink-0 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      ดาวน์โหลด
                    </a>
                  ) : user ? (
                    signedUrlLoading ? (
                      <button disabled className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs flex items-center gap-1.5 shrink-0">
                        <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                        กำลังดึงไฟล์...
                      </button>
                    ) : signedUrl ? (
                      <a
                        href={signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-xs flex items-center gap-1.5 !py-2 !px-4 shrink-0 shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        ดาวน์โหลดเอกสาร (Private)
                      </a>
                    ) : (
                      <button disabled className="px-4 py-2 rounded-xl bg-red-100 text-red-700 border border-red-200 text-xs shrink-0">
                        ไฟล์ล้มเหลว
                      </button>
                    )
                  ) : (
                    <div className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm shrink-0">
                      🔒 ล็อกอินก่อนเพื่อรับสิทธิ์ดาวน์โหลด
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0 gap-3">
              <button
                onClick={() => exportItemToWord(selectedItem, currentMeta.label)}
                className="px-4 py-2 rounded-xl border transition flex items-center gap-2 cursor-pointer shadow-sm text-xs font-bold"
                style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
              >
                <FileText className="w-4 h-4" />
                ออกรายงาน Word (.doc)
              </button>

              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition shadow-sm cursor-pointer"
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
