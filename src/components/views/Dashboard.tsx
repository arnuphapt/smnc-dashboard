'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMediaUrl } from '@/services/supabase'
import { BookOpen, Lightbulb, Award, Lock, Shield, FileText, Download, FolderDown, Search, FileCheck } from 'lucide-react'

const supabase = createClient()
import { formatExcelDate, getCategoryLabel, getCategoryColor } from '@/utils/format'
import { StatusBadge } from '@/components/StatusBadge'

export interface DownloadableForm {
  id: string
  title: string
  file_url: string
  category: string
  is_public: boolean
  sort_order: number
  created_at: string
}

export interface WisdomItem {
  id: string
  category: 'research' | 'innovation' | 'intellectual_property' | 'award' | 'utilization'
  title: string
  description?: string
  authors?: string
  is_public: boolean
  image_url?: string
  file_url?: string
  metadata: any
  created_by?: string
  created_at: string
  updated_at: string
}

interface Stats {
  research: number
  intellectual_property: number
  innovation: number
  petty_patent: number
  copyright: number
  award: number
}

// Reusable Donut Chart Component
interface DonutData {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  title: string
  centerLabel: string
  data: DonutData[]
}

const DonutChart: React.FC<DonutChartProps> = ({ title, centerLabel, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const r = 45
  const circumference = 2 * Math.PI * r // ~282.74
  let accumulatedPercent = 0

  return (
    <div className="light-card rounded-2xl p-6 bg-white border border-slate-200 flex flex-col justify-between items-center shadow-sm h-full">
      <div className="w-full text-center mb-2">
        <h4 className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: '#0EA5A0' }}></span>
          {title}
        </h4>
      </div>

      <div className="relative flex items-center justify-center my-4 shrink-0">
        <svg width="135" height="135" viewBox="0 0 120 120" className="transform -rotate-90">
          <circle cx="60" cy="60" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="14" />

          {total > 0 && data.map((item, idx) => {
            const pct = (item.value / total) * 100
            const strokeDash = (pct / 100) * circumference
            const strokeOffset = -((accumulatedPercent / 100) * circumference)
            accumulatedPercent += pct

            return (
              <circle
                key={idx}
                cx="60"
                cy="60"
                r={r}
                fill="transparent"
                stroke={item.color}
                strokeWidth="14"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )
          })}
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xs font-extrabold text-slate-700 tracking-wider uppercase leading-none">{centerLabel}</span>
        </div>
      </div>

      <div className="w-full space-y-2 text-xs text-slate-600 font-semibold px-1 mt-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
            </div>
            <span className="font-mono text-slate-400">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DashboardProps {
  onNavigate: (tab: string) => void
  userRole?: string
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userRole }) => {
  const [allItems, setAllItems] = useState<WisdomItem[]>([])
  const [recentItems, setRecentItems] = useState<WisdomItem[]>([])
  const [stats, setStats] = useState<Stats>({
    research: 0,
    intellectual_property: 0,
    innovation: 0,
    petty_patent: 0,
    copyright: 0,
    award: 0,
  })
  const [loading, setLoading] = useState(true)
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null)

  const [downloadForms, setDownloadForms] = useState<DownloadableForm[]>([])
  const [docSearch, setDocSearch] = useState('')
  const [docFilterCategory, setDocFilterCategory] = useState<'all' | 'ethics' | 'ip' | 'repository'>('all')

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await supabase
        .from('wisdom_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      const items = (data as WisdomItem[]) || []

      setAllItems(items)

      const newStats: Stats = {
        research: 0,
        intellectual_property: 0,
        innovation: 0,
        petty_patent: 0,
        copyright: 0,
        award: 0,
      }

      items.forEach((item) => {
        if (item.category === 'research') newStats.research++
        if (item.category === 'intellectual_property') {
          newStats.intellectual_property++
          const ipType = item.metadata?.ip_type
          if (ipType === 'Petty Patent (อนุสิทธิบัตร)') newStats.petty_patent++
          if (ipType === 'Copyright (ลิขสิทธิ์)') newStats.copyright++
        }
        if (item.category === 'innovation') newStats.innovation++
        if (item.category === 'award') newStats.award++
      })

      setStats(newStats)
      setRecentItems(items.slice(0, 5))
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDownloadableForms = async () => {
    try {
      const { data, error } = await supabase
        .from('downloadable_forms')
        .select('*')
        .order('sort_order', { ascending: true })
      if (!error && data) {
        setDownloadForms(data)
      }
    } catch (err) {
      console.error('Error fetching downloadable forms:', err)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    fetchDownloadableForms()

    const channel = supabase
      .channel('dashboard-items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wisdom_items' }, () => {
        fetchDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'downloadable_forms' }, () => {
        fetchDownloadableForms()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Combine downloadable forms + repository items with file attachments
  const downloadFormsList = downloadForms.map((f) => ({
    uniqueId: `form_${f.id}`,
    type: 'form',
    title: f.title,
    file_url: f.file_url,
    categoryKey: f.category,
    categoryLabel: f.category === 'ethics' ? 'แบบฟอร์มจริยธรรม' : f.category === 'ip' ? 'แบบฟอร์ม IP' : 'แบบฟอร์มทั่วไป',
    categoryBadgeStyle: f.category === 'ethics' ? 'bg-purple-50 text-purple-700 border border-purple-200' : f.category === 'ip' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-slate-100 text-slate-700 border border-slate-200',
    is_public: f.is_public,
    subInfo: 'แบบฟอร์มทางการ',
    created_at: f.created_at,
  }))

  const repositoryFilesList = allItems
    .filter((item) => item.file_url)
    .map((item) => ({
      uniqueId: `item_${item.id}`,
      type: 'repository',
      title: item.title,
      file_url: item.file_url!,
      categoryKey: 'repository',
      categoryLabel: getCategoryLabel(item.category),
      categoryBadgeStyle: 'bg-teal-50 text-teal-800 border border-teal-200',
      is_public: item.is_public,
      subInfo: item.authors || 'เอกสารประกอบผลงาน',
      created_at: item.created_at,
    }))

  const combinedDownloadList = [...downloadFormsList, ...repositoryFilesList]

  const filteredDownloadList = combinedDownloadList.filter((item) => {
    const matchesSearch = !docSearch.trim() || item.title.toLowerCase().includes(docSearch.toLowerCase())
    if (!matchesSearch) return false

    if (docFilterCategory === 'ethics') return item.categoryKey === 'ethics'
    if (docFilterCategory === 'ip') return item.categoryKey === 'ip'
    if (docFilterCategory === 'repository') return item.type === 'repository'
    return true
  })

  // Calculate Last 6 Months trend data
  const getTrendData = () => {
    const data: { label: string; count: number }[] = []
    const now = new Date()
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth()

      const count = allItems.filter(item => {
        const itemDate = new Date(item.created_at)
        return itemDate.getFullYear() === year && itemDate.getMonth() === month
      }).length

      data.push({
        label: `${thaiMonths[month]} ${((year + 543) % 100)}`,
        count
      })
    }
    return data
  }

  const trendData = getTrendData()

  // SVG Line Chart calculations
  const chartWidth = 750
  const chartHeight = 220
  const paddingX = 50
  const paddingY = 35
  const chartMaxVal = Math.max(...trendData.map(d => d.count), 5)

  const points = trendData.map((d, i) => {
    const x = paddingX + i * (chartWidth - paddingX * 2) / (trendData.length - 1)
    const y = chartHeight - paddingY - (d.count / chartMaxVal) * (chartHeight - paddingY * 2)
    return { x, y, label: d.label, count: d.count }
  })

  // Build SVG path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : ''

  // 1. Types Donut Data
  const ipItems = allItems.filter(item => item.category === 'intellectual_property')
  const ipTypeMap: Record<string, number> = {}
  ipItems.forEach(item => {
    const type = item.metadata?.ip_type || 'ไม่ระบุ'
    ipTypeMap[type] = (ipTypeMap[type] || 0) + 1
  })
  const donutTypeData: DonutData[] = Object.entries(ipTypeMap).map(([label, val], idx) => {
    const colors = ['#0f4c81', '#06b6d4', '#10b981', '#a855f7']
    return { label, value: val, color: colors[idx % colors.length] }
  })

  // 2. Creators Donut Data
  const creatorsMap: Record<string, number> = {}
  ipItems.forEach(item => {
    const creator = item.metadata?.creator_type || 'ไม่ระบุ'
    creatorsMap[creator] = (creatorsMap[creator] || 0) + 1
  })
  const donutCreatorData: DonutData[] = Object.entries(creatorsMap).map(([label, val], idx) => {
    const colors = ['#0f4c81', '#06b6d4', '#a855f7', '#fbbf24']
    return { label, value: val, color: colors[idx % colors.length] }
  })

  // 3. Source Donut Data
  const sourceMap: Record<string, number> = {}
  ipItems.forEach(item => {
    const source = item.metadata?.source || 'ไม่ระบุ'
    sourceMap[source] = (sourceMap[source] || 0) + 1
  })
  const donutSourceData: DonutData[] = Object.entries(sourceMap).map(([label, val], idx) => {
    const colors = ['#0f4c81', '#06b6d4', '#10b981', '#fbbf24']
    return { label, value: val, color: colors[idx % colors.length] }
  })

  // 4. Innovation Donut Data
  const innovationItems = allItems.filter(item => item.category === 'innovation')
  const innovationMap: Record<string, number> = {}
  innovationItems.forEach(item => {
    const type = item.metadata?.innovation_type || 'ไม่ระบุ'
    innovationMap[type] = (innovationMap[type] || 0) + 1
  })
  const donutInnovationData: DonutData[] = Object.entries(innovationMap).map(([label, val], idx) => {
    const colors = ['#0f4c81', '#06b6d4', '#10b981', '#a855f7']
    return { label, value: val, color: colors[idx % colors.length] }
  })

  // IP Progress calculations
  const totalIp = ipItems.length
  const ipPending = ipItems.filter(item => item.metadata?.status === 'รอพิจารณา').length
  const ipExported = ipItems.filter(item => item.metadata?.status === 'ส่งเอกสารออก').length

  const progressPendingPct = totalIp > 0 ? (ipPending / totalIp) * 100 : 0
  const progressExportedPct = totalIp > 0 ? (ipExported / totalIp) * 100 : 0

  // Timeline IP items sorted by Excel serial export_date descending
  const timelineIpItems = [...ipItems].sort((a, b) => {
    const dateA = Number(a.metadata?.export_date) || 0
    const dateB = Number(b.metadata?.export_date) || 0
    return dateB - dateA
  })

  // Stats cards configuration
  const cardConfigs = [
    { label: 'ผลงานวิจัย', count: stats.research, icon: BookOpen, color: 'border-l-[6px] border-l-blue-900', textColor: 'text-blue-900', tab: 'research' },
    { label: 'ทรัพย์สินทางปัญญา', count: stats.intellectual_property, icon: Lock, color: 'border-l-[6px] border-l-amber-500', textColor: 'text-amber-500', tab: 'intellectual_property' },
    { label: 'ผลงานนวัตกรรม', count: stats.innovation, icon: Lightbulb, color: 'border-l-[6px] border-l-emerald-600', textColor: 'text-emerald-600', tab: 'innovation' },
    { label: 'อนุสิทธิบัตร', count: stats.petty_patent, icon: FileText, color: 'border-l-[6px] border-l-cyan-600', textColor: 'text-cyan-600', tab: 'intellectual_property' },
    { label: 'ลิขสิทธิ์', count: stats.copyright, icon: Shield, color: 'border-l-[6px] border-l-purple-600', textColor: 'text-purple-600', tab: 'intellectual_property' },
    { label: 'รางวัล', count: stats.award, icon: Award, color: 'border-l-[6px] border-l-indigo-500', textColor: 'text-indigo-500', tab: 'award' },
  ]

  const getStatusBadgeClass = (status: string) => {
    if (status === 'รอพิจารณา') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="spinner-teal"></div>
        <p className="text-sm animate-pulse" style={{ color: '#64748B' }}>กำลังดึงข้อมูลสถิติ...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Page Header — plain heading + description, no card */}
      <div className="page-header-band">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: '#64748B' }}>
            SMNC · Digital Research Workspace
          </span>
          <span className="record-tag shrink-0">REC · DRW-00</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
          <div>
            <h2 className="header-display text-2xl font-bold leading-tight" style={{ color: '#0B1D3A' }}>
              คลังปัญญาดิจิตอล SMNC
            </h2>
            <p className="text-sm font-medium mt-1" style={{ color: '#64748B' }}>
              ระบบแสดงผลข้อมูลเกี่ยวกับคลังผลงาน คลินิกวิจัย จริยธรรมการวิจัย และทรัพย์สินทางปัญญา
            </p>
          </div>
          {userRole && (
            <span
              className="self-start md:self-end text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full shrink-0"
              style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.3)' }}
            >
              {userRole === 'admin' ? 'ผู้ดูแลระบบ' : userRole === 'expert' ? 'ผู้ทรงคุณวุฒิ' : 'อาจารย์'}
            </span>
          )}
        </div>
      </div>

      {/* 1. Summary Stats Cards Row (6 Columns) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cardConfigs.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              onClick={() => onNavigate(card.tab)}
              className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between items-start relative overflow-hidden group cursor-pointer hover:shadow-md transition-all duration-200 ${card.color}`}
              style={{ ['--tw-shadow-color' as any]: 'rgba(14,165,160,0.08)' }}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: '#94A3B8' }}>
                  {card.label}
                </span>
                <span className="text-3xl font-extrabold mt-1 block leading-tight" style={{ color: '#0B1D3A' }}>
                  {card.count}
                </span>
              </div>
              <div className="absolute right-4 bottom-4 text-slate-200 group-hover:text-slate-300 transition-colors pointer-events-none">
                <Icon className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>
          )
        })}
      </div>

      {/* 2. Donut Charts Row (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DonutChart title="ประเภทสิทธิ์" centerLabel="IP" data={donutTypeData} />
        <DonutChart title="ผู้สร้างสรรค์" centerLabel="ผู้สร้าง" data={donutCreatorData} />
        <DonutChart title="ที่มาของผลงาน IP" centerLabel="ที่มา" data={donutSourceData} />
        <DonutChart title="ประเภทนวัตกรรม" centerLabel="นวัตกรรม" data={donutInnovationData} />
      </div>

      {/* 3. IP Progress & Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Column: Progress Bars & Live Activity feed */}
        <div className="lg:col-span-1 space-y-6 h-full">
          {/* IP Progress Bars */}
          <div className="light-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100" style={{ color: '#0B1D3A' }}>
              <span className="w-1.5 h-3.5 rounded-full" style={{ background: '#0EA5A0' }}></span>
              ความคืบหน้าทรัพย์สินทางปัญญา
            </h3>

            <div className="space-y-4">
              {/* Progress 1 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold" style={{ color: '#475569' }}>
                  <span>ได้เลขคำขอ / รอพิจารณา</span>
                  <span style={{ color: '#0EA5A0' }}>{ipPending} รายการ ({progressPendingPct.toFixed(0)}%)</span>
                </div>
                <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: '#E8F0F8' }}>
                  <div
                    style={{ width: `${progressPendingPct}%`, background: '#0EA5A0' }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Progress 2 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold" style={{ color: '#475569' }}>
                  <span>ส่งเอกสารออก (รอเลขคำขอ)</span>
                  <span style={{ color: '#7C3AED' }}>{ipExported} รายการ ({progressExportedPct.toFixed(0)}%)</span>
                </div>
                <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: '#E8F0F8' }}>
                  <div
                    style={{ width: `${progressExportedPct}%` }}
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Recent updates feed (Live) */}
          <div className="light-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                อัปเดตล่าสุดทั่วไป
              </h3>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            </div>

            <div className="space-y-3.5">
              {recentItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex gap-3 text-xs">
                  {item.image_url ? (
                    <img
                      src={getMediaUrl(item.image_url, item.is_public)}
                      alt={item.title}
                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-[10px] ${getCategoryColor(item.category)}`}>
                      {getCategoryLabel(item.category)[0]}
                    </div>
                  )}
                  <div className="space-y-0.5 truncate">
                    <h5 className="font-bold text-slate-800 truncate">{item.title}</h5>
                    <p className="text-[10px] text-slate-400 font-medium">ผู้จัดทำ: {item.authors || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: IP Timeline */}
        <div className="lg:col-span-2 light-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider pb-3 border-b border-slate-100 mb-6 flex items-center gap-1.5" style={{ color: '#0B1D3A' }}>
            <span className="w-1.5 h-3.5 rounded-full" style={{ background: '#0EA5A0' }}></span>
            ไทม์ไลน์การยื่นขอทรัพย์สินทางปัญญา
          </h3>

          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {timelineIpItems.map((item, idx) => {
              const isPetty = item.metadata?.ip_type === 'Petty Patent (อนุสิทธิบัตร)'
              const dateStr = formatExcelDate(item.metadata?.export_date)
              const status = item.metadata?.status || 'ส่งเอกสารออก'
              const badgeClass = getStatusBadgeClass(status)

              // Timeline node marker colors
              const dotColors = ['bg-blue-900', 'bg-cyan-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-500', 'bg-pink-500']
              const dotBg = dotColors[idx % dotColors.length]

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline circular dot */}
                  <span className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-125 ${dotBg}`} />

                  {/* Timeline inner card */}
                  <div className="p-4 border rounded-xl transition duration-200 space-y-1" style={{ background: '#F0F7FF', borderColor: '#DAEEFF' }}>
                    <h4 className="text-[11px] font-bold leading-snug transition-colors" style={{ color: '#0B1D3A' }}>
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 font-semibold pt-1">
                      <span>{dateStr}</span>
                      <span>|</span>
                      <span>{isPetty ? 'อนุสิทธิบัตร' : 'ลิขสิทธิ์'}</span>
                      <span>|</span>
                      <StatusBadge status={status} size="sm" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* 4. Large 6-Month Upload Trend Chart */}
      <div className="light-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#0B1D3A' }}>
              <span className="w-1.5 h-3.5 rounded-full shrink-0" style={{ background: '#0EA5A0' }}></span>
              แนวโน้มการเพิ่มข้อมูลคลังความรู้ย้อนหลัง 6 เดือน
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>จำนวนการบันทึกรายการเพิ่มเข้าคลังสะสมของทุกหมวดหมู่รายเดือน</p>
          </div>
          <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full" style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.3)' }}>
            Month-on-Month
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[650px] relative">
            <svg width="100%" height={220} viewBox="0 0 750 220" className="mx-auto">
              <defs>
                <linearGradient id="trend-line-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal Guide Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => {
                const y = 35 + ratio * (220 - 35 * 2)
                const gridVal = Math.round(chartMaxVal * (1 - ratio))
                return (
                  <g key={gridIdx} className="opacity-40">
                    <line
                      x1={50}
                      y1={y}
                      x2={700}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={50 - 12}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 font-mono font-bold text-[10px]"
                    >
                      {gridVal}
                    </text>
                  </g>
                )
              })}

              {/* Area Gradient */}
              {areaPath && (
                <path d={areaPath} fill="url(#trend-line-grad)" className="transition-all duration-500" />
              )}

              {/* Line Path */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#0e7490"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500"
                />
              )}

              {/* Data points */}
              {points.map((p, i) => (
                <g key={i} className="group">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="6"
                    fill="#ffffff"
                    stroke="#0e7490"
                    strokeWidth="3.5"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() => setHoveredTrendIndex(i)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                  />

                  {/* Tooltip labels */}
                  <g className={`transition-opacity duration-200 ${hoveredTrendIndex === i ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
                    <rect
                      x={p.x - 26}
                      y={p.y - 28}
                      width="52"
                      height="20"
                      rx="4"
                      fill="#0f172a"
                    />
                    <text
                      x={p.x}
                      y={p.y - 14}
                      textAnchor="middle"
                      className="fill-white font-mono font-bold text-[11px]"
                    >
                      {p.count} งาน
                    </text>
                  </g>

                  {/* X Axis Labels */}
                  <text
                    x={p.x}
                    y={220 - 8}
                    textAnchor="middle"
                    className="fill-slate-500 font-bold text-[10px]"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* 5. Download Center Section (คลังเอกสารและแบบฟอร์มดาวน์โหลด) */}
      <div className="light-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2 text-slate-900">
                <FolderDown className="w-5 h-5 text-teal-600" />
                คลังเอกสารและแบบฟอร์มดาวน์โหลด (Download Center)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              รวบรวมแบบฟอร์มขอรับรองจริยธรรม แบบฟอร์มยื่นทรัพย์สินทางปัญญา และเอกสารประกอบคลังปัญญาประจำสถาบัน
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="ค้นหาชื่อเอกสาร/แบบฟอร์ม..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'ethics', label: 'แบบฟอร์มจริยธรรม' },
            { id: 'ip', label: 'แบบฟอร์ม IP' },
            { id: 'repository', label: 'เอกสารคลังปัญญา' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDocFilterCategory(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                docFilterCategory === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Download Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {filteredDownloadList.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <FileCheck className="w-8 h-8 mx-auto opacity-50 text-slate-400" />
              <p className="text-xs font-semibold">ไม่พบเอกสารหรือแบบฟอร์มดาวน์โหลดตามคำค้นหา</p>
            </div>
          ) : (
            filteredDownloadList.map((docItem) => (
              <div
                key={docItem.uniqueId}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${docItem.categoryBadgeStyle}`}>
                      {docItem.categoryLabel}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      {docItem.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors line-clamp-2 leading-snug">
                    {docItem.title}
                  </h4>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium truncate">
                    <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">{docItem.subInfo}</span>
                  </div>

                  <a
                    href={getMediaUrl(docItem.file_url, docItem.is_public)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white border border-teal-200/60 text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3 h-3" />
                    ดาวน์โหลด
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
