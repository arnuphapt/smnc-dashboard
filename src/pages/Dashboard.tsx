import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { BookOpen, Lightbulb, FileCheck, Award, Share2, Globe, Lock, TrendingUp } from 'lucide-react'

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
  innovation: number
  intellectual_property: number
  award: number
  utilization: number
  publicCount: number
  privateCount: number
}

interface DashboardProps {
  onNavigate: (tab: string) => void
  userRole?: string
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userRole }) => {
  const [stats, setStats] = useState<Stats>({
    research: 0,
    innovation: 0,
    intellectual_property: 0,
    award: 0,
    utilization: 0,
    publicCount: 0,
    privateCount: 0,
  })
  const [allItems, setAllItems] = useState<WisdomItem[]>([])
  const [recentItems, setRecentItems] = useState<WisdomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

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
        innovation: 0,
        intellectual_property: 0,
        award: 0,
        utilization: 0,
        publicCount: 0,
        privateCount: 0,
      }

      items.forEach((item) => {
        if (item.category in newStats) {
          newStats[item.category as keyof Omit<Stats, 'publicCount' | 'privateCount'>]++
        }
        if (item.is_public) {
          newStats.publicCount++
        } else {
          newStats.privateCount++
        }
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wisdom_items' },
        () => {
          fetchDashboardData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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
  const chartWidth = 550
  const chartHeight = 160
  const paddingX = 40
  const paddingY = 25
  const chartMaxVal = Math.max(...trendData.map(d => d.count), 5) // Minimum scale ceiling of 5

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

  // Donut Chart calculations
  const totalItems = stats.publicCount + stats.privateCount
  const publicPercentage = totalItems > 0 ? (stats.publicCount / totalItems) * 100 : 0
  const privatePercentage = totalItems > 0 ? (stats.privateCount / totalItems) * 100 : 0

  // SVG Circle Donut properties
  const donutR = 36
  const donutCircumference = 2 * Math.PI * donutR // ~226.2
  const publicStrokeDash = (publicPercentage / 100) * donutCircumference
  const privateStrokeDash = (privatePercentage / 100) * donutCircumference
  const publicStrokeOffset = 0
  const privateStrokeOffset = -publicStrokeDash

  const statCards = [
    {
      id: 'research',
      title: 'คลังผลงานวิจัย',
      count: stats.research,
      icon: BookOpen,
      color: 'border-l-4 border-l-cyan-600',
      iconColor: 'bg-cyan-50 text-cyan-700',
      description: 'งานวิจัยทางวิชาการและ R2R',
    },
    {
      id: 'innovation',
      title: 'คลังนวัตกรรม',
      count: stats.innovation,
      icon: Lightbulb,
      color: 'border-l-4 border-l-amber-600',
      iconColor: 'bg-amber-50 text-amber-700',
      description: 'สิ่งประดิษฐ์และโมเดลการเรียนรู้',
    },
    {
      id: 'intellectual_property',
      title: 'คลังทรัพย์สินทางปัญญา',
      count: stats.intellectual_property,
      icon: FileCheck,
      color: 'border-l-4 border-l-emerald-600',
      iconColor: 'bg-emerald-50 text-emerald-700',
      description: 'สิทธิบัตร อนุสิทธิบัตร และลิขสิทธิ์',
    },
    {
      id: 'award',
      title: 'คลังรางวัลเชิดชูเกียรติ',
      count: stats.award,
      icon: Award,
      color: 'border-l-4 border-l-purple-600',
      iconColor: 'bg-purple-50 text-purple-700',
      description: 'รางวัลผลงานดีเด่นระดับต่างๆ',
    },
    {
      id: 'utilization',
      title: 'คลังการนำไปใช้ประโยชน์',
      count: stats.utilization,
      icon: Share2,
      color: 'border-l-4 border-l-pink-600',
      iconColor: 'bg-pink-50 text-pink-700',
      description: 'ผลงานที่ถูกนำไปใช้จริงในชุมชน/เชิงพาณิชย์',
    },
  ]

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
        <p className="text-slate-500 text-sm animate-pulse">กำลังประมวลผลข้อมูลกราฟสถิติเรียลไทม์...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800">
      {/* Welcome Banner - Light soft teal/blue gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-50 via-white to-blue-50/30 p-8 border border-slate-200 shadow-sm">
        {/* Wisdom Pulse ECG Signature */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none hidden lg:block">
          <svg className="w-64 h-32 text-cyan-600" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path className="ekg-line" d="M0 15 H30 L35 5 L40 25 L45 10 L50 18 L55 15 H100" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-100/60 px-2.5 py-1 rounded-md border border-cyan-200/40">
              SMNC Intelligence Hub
            </span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/40 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              Live Sync Active
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            คลังปัญญาดิจิทัล <span className="text-cyan-800">วิทยาลัยพยาบาลศรีมหาสารคาม</span>
          </h2>
          <p className="text-slate-600 max-w-2xl text-xs leading-relaxed">
            ระบบจัดเก็บและวิเคราะห์ผลงานวิจัย นวัตกรรม และสถิติทรัพย์สินทางปัญญากลุ่มพยาบาลศาสตรศึกษา 
            แสดงผลสถิติและข้อมูลแนวโน้มการอัปโหลดแบบเรียลไทม์
          </p>
          {userRole && (
            <div className="inline-block text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded border border-cyan-100/80 capitalize">
              สิทธิ์การใช้งาน: {userRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : userRole === 'expert' ? 'ผู้ทรงคุณวุฒิ (Expert)' : 'อาจารย์ (Teacher)'}
            </div>
          )}
        </div>
      </div>

      {/* Grid of Visualization Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART 1: Donut Chart - Public vs Private Ratio */}
        <div className="light-card rounded-2xl p-6 shadow-sm bg-white flex flex-col justify-between border border-slate-200">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-cyan-700 rounded-full"></span>
              สัดส่วนการเข้าถึงข้อมูล (Accessibility Ratio)
            </h3>
            <p className="text-[10px] text-slate-500">สัดส่วนเอกสารสาธารณะเทียบกับเอกสารจำกัดสิทธิ์ภายในสถาบัน</p>
          </div>

          <div className="my-6 flex justify-center items-center relative">
            <svg width="150" height="150" viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Background Track Circle */}
              <circle cx="50" cy="50" r={donutR} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
              
              {totalItems > 0 ? (
                <>
                  {/* Public segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r={donutR}
                    fill="transparent"
                    stroke="#0891b2" // cyan-600
                    strokeWidth="12"
                    strokeDasharray={`${publicStrokeDash} ${donutCircumference}`}
                    strokeDashoffset={publicStrokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  {/* Private segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r={donutR}
                    fill="transparent"
                    stroke="#f59e0b" // amber-500
                    strokeWidth="12"
                    strokeDasharray={`${privateStrokeDash} ${donutCircumference}`}
                    strokeDashoffset={privateStrokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </>
              ) : (
                <circle cx="50" cy="50" r={donutR} fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
              )}
            </svg>
            
            {/* Center Label */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-slate-900 leading-none">{totalItems}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">ผลงานรวม</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 shrink-0"></span>
              <div>
                <div className="text-[9px] text-slate-500">สาธารณะ</div>
                <div className="text-slate-800 font-bold">{stats.publicCount} รายการ ({publicPercentage.toFixed(0)}%)</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <div>
                <div className="text-[9px] text-slate-500">ดูเฉพาะภายใน</div>
                <div className="text-slate-800 font-bold">{stats.privateCount} รายการ ({privatePercentage.toFixed(0)}%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: Horizontal Bar Chart - Category comparative counts */}
        <div className="light-card rounded-2xl p-6 shadow-sm bg-white border border-slate-200 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-cyan-700 rounded-full"></span>
              ปริมาณผลงานแยกตามคลังปัญญา (Wisdom Categories Breakdown)
            </h3>
            <p className="text-[10px] text-slate-500">เปรียบเทียบสัดส่วนปริมาณงานเอกสารของคลังความรู้แต่ละด้าน</p>
          </div>

          <div className="space-y-4 my-6">
            {statCards.map((c) => {
              const maxCount = Math.max(...statCards.map(sc => sc.count), 1)
              const pct = (c.count / maxCount) * 100
              const colorBg = c.id === 'research' ? 'bg-cyan-600' :
                              c.id === 'innovation' ? 'bg-amber-500' :
                              c.id === 'intellectual_property' ? 'bg-emerald-500' :
                              c.id === 'award' ? 'bg-purple-500' : 'bg-pink-500'
              return (
                <div key={c.id} className="space-y-1 group">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="group-hover:text-cyan-700 transition">{c.title}</span>
                    <span className="font-mono text-slate-500">{c.count} รายการ</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                    <div 
                      style={{ width: `${pct}%` }} 
                      className={`h-full ${colorBg} rounded-full transition-all duration-700`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-3 flex justify-between">
            <span>คำนวณจากฐานข้อมูลเรียลไทม์ทั้งหมด</span>
            <span>ความยาวแถบสะท้อนสัดส่วนเทียบกับกลุ่มสูงสุด</span>
          </div>
        </div>

        {/* CHART 3: Line Chart - Upload activity trend in 6 months */}
        <div className="light-card rounded-2xl p-6 shadow-sm bg-white border border-slate-200 lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-700" />
                แนวโน้มความเคลื่อนไหวคลังข้อมูลย้อนหลัง 6 เดือน (6-Month Upload Trend)
              </h3>
              <p className="text-[10px] text-slate-500">จำนวนการบันทึกรายการเพิ่มเข้าคลังในแต่ละรอบเดือน (นับรวมทุกหมวดหมู่)</p>
            </div>
            <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-150/40 font-mono">
              Month-on-Month
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[550px] relative">
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="mx-auto">
                <defs>
                  {/* Grid background gradient area */}
                  <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0891b2" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => {
                  const y = paddingY + ratio * (chartHeight - paddingY * 2)
                  const gridVal = Math.round(chartMaxVal * (1 - ratio))
                  return (
                    <g key={gridIdx} className="opacity-40">
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 font-mono font-bold text-[9px]"
                      >
                        {gridVal}
                      </text>
                    </g>
                  )
                })}

                {/* Area Gradient */}
                {areaPath && (
                  <path d={areaPath} fill="url(#line-grad)" className="transition-all duration-500" />
                )}

                {/* Line Path */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#0e7490"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500"
                  />
                )}

                {/* Data point markers */}
                {points.map((p, i) => (
                  <g key={i} className="group">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="#ffffff"
                      stroke="#0e7490"
                      strokeWidth="3"
                      className="cursor-pointer transition-transform hover:scale-150"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                    
                    {/* Tooltip labels */}
                    <g className={`transition-opacity duration-200 ${hoveredIndex === i ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
                      <rect
                        x={p.x - 22}
                        y={p.y - 25}
                        width="44"
                        height="18"
                        rx="4"
                        fill="#0f172a"
                      />
                      <text
                        x={p.x}
                        y={p.y - 13}
                        textAnchor="middle"
                        className="fill-white font-mono font-bold text-[10px]"
                      >
                        {p.count} งาน
                      </text>
                    </g>

                    {/* X Axis Labels */}
                    <text
                      x={p.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      className="fill-slate-500 font-bold text-[9px]"
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

      {/* Grid for 5 Repositories navigation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 bg-cyan-700 rounded-full"></span>
          <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">
            คลังปัญญาหลัก 5 ส่วน
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.id}
                onClick={() => onNavigate(card.id)}
                className={`light-card light-card-hover rounded-xl p-6 cursor-pointer flex flex-col justify-between border-slate-200 relative group shadow-sm ${card.color}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-lg ${card.iconColor} shadow-sm transform group-hover:scale-105 transition duration-300`}>
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{card.count}</div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mt-4 group-hover:text-cyan-700 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3 group-hover:text-cyan-700 transition-colors">
                  <span>เปิดคลังความรู้</span>
                  <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live Recent Updates Feed */}
      <div className="light-card rounded-2xl p-6 border-slate-200 shadow-sm bg-white">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-cyan-700 rounded-full"></span>
            <h3 className="text-base font-bold text-slate-800">
              ผลงานวิชาการอัปเดตล่าสุด (Live Activity Feed)
            </h3>
          </div>
          <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-200/50 px-2.5 py-0.5 rounded text-[10px] text-cyan-800 font-bold uppercase tracking-wider">
            <svg className="w-5 h-3 text-cyan-700" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className="ekg-line" d="M0 15 H30 L35 5 L40 25 L45 10 L50 18 L55 15 H100" stroke="currentColor" strokeWidth="2.5" />
            </svg>
            Realtime Feed
          </div>
        </div>
        
        {recentItems.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            ยังไม่มีข้อมูลในระบบจัดเก็บผลงานความรู้
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentItems.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${getCategoryColor(item.category)}`}>
                      {getCategoryLabel(item.category)}
                    </span>
                    {item.is_public ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-150/40">
                        <Globe className="w-2.5 h-2.5" /> สาธารณะ
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-150/40">
                        <Lock className="w-2.5 h-2.5" /> ภายในสถาบัน
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(item.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-cyan-700 transition-colors">
                    {item.title}
                  </h4>
                  {item.authors && (
                    <p className="text-[10px] text-slate-500 font-semibold">คณะผู้จัดทำ: {item.authors}</p>
                  )}
                </div>
                <button
                  onClick={() => onNavigate(item.category)}
                  className="self-start md:self-center px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-700/30 text-xs font-bold text-slate-600 hover:text-cyan-700 transition shadow-sm cursor-pointer"
                >
                  เปิดดูรายละเอียด
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
