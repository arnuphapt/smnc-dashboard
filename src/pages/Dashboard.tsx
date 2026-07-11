import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { BookOpen, Lightbulb, Award, Lock, Shield, FileText } from 'lucide-react'

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
          <span className="w-2 h-2 rounded-full bg-cyan-700"></span>
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

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await supabase
        .from('wisdom_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      const items = (data as WisdomItem[]) || []
      setAllItems(items)

      // Calculate stats
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
          if (ipType === 'PettyPatent') newStats.petty_patent++
          if (ipType === 'Copyright') newStats.copyright++
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

  useEffect(() => {
    fetchDashboardData()

    const channel = supabase
      .channel('dashboard-items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wisdom_items' }, () => {
        fetchDashboardData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Helper to format Excel serial dates to DD/MM/YY
  const formatExcelDate = (serial: any) => {
    if (!serial) return ''
    if (isNaN(Number(serial))) return String(serial)
    const excelSerial = Number(serial)
    const date = new Date((excelSerial - 25569) * 86400 * 1000)
    if (isNaN(date.getTime())) return String(serial)
    
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yy = String(date.getFullYear()).slice(-2)
    return `${dd}/${mm}/${yy}`
  }

  // Calculate Last 6 Months trend data
  const getTrendData = () => {
    const data = []
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
  const pettyPatentCount = ipItems.filter(item => item.metadata?.ip_type === 'PettyPatent').length
  const copyrightCount = ipItems.filter(item => item.metadata?.ip_type === 'Copyright').length
  
  const donutTypeData: DonutData[] = [
    { label: 'อนุสิทธิบัตร', value: pettyPatentCount, color: '#0f4c81' },
    { label: 'ลิขสิทธิ์', value: copyrightCount, color: '#06b6d4' }
  ]

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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'research': return 'วิจัย'
      case 'innovation': return 'นวัตกรรม'
      case 'intellectual_property': return 'ทรัพย์สินทางปัญญา'
      case 'award': return 'รางวัล'
      case 'utilization': return 'การใช้ประโยชน์'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'research': return 'bg-cyan-50 text-cyan-700 border border-cyan-200/50'
      case 'innovation': return 'bg-amber-50 text-amber-700 border border-amber-200/50'
      case 'intellectual_property': return 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
      case 'award': return 'bg-purple-50 text-purple-700 border border-purple-200/50'
      case 'utilization': return 'bg-pink-50 text-pink-700 border border-pink-200/50'
      default: return 'bg-slate-50 text-slate-600 border border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-cyan-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm animate-pulse">กำลังดึงข้อมูลสถิติและแปลความคุ้มครองระบบ...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800">
      
      {/* Top Header Row with Title and Role */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            ระบบวิเคราะห์และคลังปัญญาดิจิทัล SMNC
          </h2>
          <p className="text-xs text-slate-500 mt-1">สถิติและข้อมูลการคุ้มครองทรัพย์สินทางปัญญาแบบเรียลไทม์</p>
        </div>
        {userRole && (
          <div className="self-start md:self-center text-xs font-bold text-cyan-800 bg-cyan-50/60 px-3.5 py-1.5 rounded-lg border border-cyan-200/50">
            สิทธิ์การใช้งาน: {userRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : userRole === 'expert' ? 'ผู้ทรงคุณวุฒิ (Expert)' : 'อาจารย์ (Teacher)'}
          </div>
        )}
      </div>

      {/* 1. Summary Stats Cards Row (6 Columns) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cardConfigs.map((card, idx) => {
          const Icon = card.icon
          return (
            <div 
              key={idx} 
              onClick={() => onNavigate(card.tab)}
              className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between items-start relative overflow-hidden group cursor-pointer hover:border-cyan-700/30 hover:shadow-md transition-all duration-200 ${card.color}`}
            >
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {card.label}
                </span>
                <span className="text-3xl font-extrabold text-slate-900 mt-1 block leading-tight">
                  {card.count}
                </span>
              </div>
              <div className="absolute right-4 bottom-4 text-slate-300 group-hover:text-slate-400 transition-colors pointer-events-none">
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
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <span className="w-1.5 h-3.5 bg-cyan-700 rounded-full"></span>
              ความคืบหน้าทรัพย์สินทางปัญญา
            </h3>
            
            <div className="space-y-4">
              {/* Progress 1 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>ได้เลขคำขอ / รอพิจารณา</span>
                  <span className="text-cyan-800">{ipPending} รายการ ({progressPendingPct.toFixed(0)}%)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${progressPendingPct}%` }} 
                    className="h-full bg-cyan-700 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Progress 2 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>ส่งเอกสารออก (รอเลขคำขอ)</span>
                  <span className="text-pink-600">{ipExported} รายการ ({progressExportedPct.toFixed(0)}%)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${progressExportedPct}%` }} 
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500"
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
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-[10px] ${getCategoryColor(item.category)}`}>
                    {getCategoryLabel(item.category)[0]}
                  </div>
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
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-6 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-cyan-700 rounded-full"></span>
            ไทม์ไลน์การยื่นขอทรัพย์สินทางปัญญา
          </h3>

          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {timelineIpItems.map((item, idx) => {
              const isPetty = item.metadata?.ip_type === 'PettyPatent'
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
                  <div className="p-4 bg-slate-50 hover:bg-cyan-50/20 border border-slate-200/60 rounded-xl transition duration-200 space-y-1">
                    <h4 className="text-[11px] font-bold text-slate-800 group-hover:text-cyan-800 transition-colors leading-snug">
                      {item.title}
                    </h4>
                    
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 font-semibold pt-1">
                      <span>{dateStr}</span>
                      <span>|</span>
                      <span>{isPetty ? 'อนุสิทธิบัตร' : 'ลิขสิทธิ์'}</span>
                      <span>|</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold leading-none ${badgeClass}`}>
                        {status}
                      </span>
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
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              📈 แนวโน้มการเพิ่มข้อมูลคลังความรู้ย้อนหลัง 6 เดือน
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">จำนวนการบันทึกรายการเพิ่มเข้าคลังสะสมของทุกหมวดหมู่รายเดือน</p>
          </div>
          <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded border border-cyan-150 font-mono">
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

    </div>
  )
}
