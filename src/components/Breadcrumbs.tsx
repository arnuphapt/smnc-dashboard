import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

// Translation dictionary for Thai labels of URL segments
const SEGMENT_TRANSLATIONS: Record<string, string> = {
  // Main Routes
  clinic: 'คลินิกวิจัย',
  ethics: 'จริยธรรมการวิจัย',
  'ip-application': 'ทรัพย์สินทางปัญญา',
  repositories: 'คลังปัญญา 5 ด้าน',
  admin: 'ระบบหลังบ้าน',
  login: 'เข้าสู่ระบบ',

  // Repositories Categories
  research: 'คลังผลงานวิจัย',
  innovation: 'คลังนวัตกรรม',
  intellectual_property: 'คลังทรัพย์สินทางปัญญา',
  award: 'คลังรางวัลและความสำเร็จ',
  utilization: 'การนำไปใช้ประโยชน์',

  // Admin Panel Sections
  items: 'จัดการผลงาน',
  lookups: 'ตัวเลือกคัดกรอง',
  users: 'ผู้ใช้งานและสิทธิ์',
  ip: 'ทรัพย์สินทางปัญญา',
}

// Fallback formatter for unmapped or dynamic segments (e.g. "some-path" -> "Some Path")
const formatSegment = (segment: string): string => {
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()
  const pathname = location.pathname

  // Don't show breadcrumbs on the homepage / dashboard
  if (pathname === '/') return null

  const segments = pathname.split('/').filter(Boolean)
  const items = [
    { label: 'หน้าแรก', to: '/' }
  ]

  let accumulatedPath = ''
  segments.forEach((segment) => {
    accumulatedPath += `/${segment}`
    const label = SEGMENT_TRANSLATIONS[segment.toLowerCase()] || formatSegment(segment)
    items.push({
      label,
      to: accumulatedPath,
    })
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-4 animate-fadeIn">
      <ol className="flex items-center flex-wrap gap-1.5 text-xs text-slate-400 font-semibold">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
              <li className="flex items-center">
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="hover:text-[#0EA5A0] transition-colors flex items-center gap-1 focus:outline-none focus:underline"
                    style={{ color: '#64748B' }}
                  >
                    {idx === 0 && <Home className="w-3.5 h-3.5 -mt-0.5" />}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span className="font-extrabold truncate flex items-center gap-1" style={{ color: '#0B1D3A' }}>
                    {idx === 0 && <Home className="w-3.5 h-3.5 -mt-0.5 text-[#0B1D3A]" />}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
