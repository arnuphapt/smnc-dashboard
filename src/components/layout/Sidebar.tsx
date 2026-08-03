'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { hasRole } from '@/utils/roleHelper'
import { REPOSITORY_SUBNAV, MASTERDATA_SUBNAV } from '@/config/navigation'
import {
  Shield,
  BookOpen,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Calendar,
  Clipboard,
  Award,
  Zap
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const { profile } = useAuth()
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const sidebarLinkClass = (active: boolean) =>
    `px-4 py-3 rounded-full text-xs font-extrabold transition-all duration-200 flex items-center gap-3 ${
      active
        ? 'bg-[#00796B] text-white shadow-md shadow-[#00796B]/20 scale-[1.02]'
        : 'text-[#0F172A] hover:text-[#00796B] hover:bg-[#F1F5F9]'
    }`

  const isRepositoriesActive = pathname.startsWith('/repositories')
  const isMasterdataActive = pathname.startsWith('/master')
  const activeRepoCategory = pathname.split('/')[2] || 'research'
  const activeMasterdataSlug = pathname === '/master' ? '' : pathname.replace('/master/', '') || ''

  interface SidebarChild { to: string; label: string; active: boolean; isHeader?: boolean }
  interface SidebarItem { key: string; to: string; icon: React.ReactNode; label: string; active: boolean; children?: SidebarChild[] }

  const navItems: SidebarItem[] = [
    { key: 'dashboard', to: '/', icon: <LayoutDashboard className="w-4 h-4 shrink-0" />, label: 'สรุปภาพรวม (Dashboard)', active: pathname === '/' },
    {
      key: 'repositories',
      to: '/repositories/research',
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
      label: 'คลังปัญญา 5 ด้าน',
      active: isRepositoriesActive,
      children: REPOSITORY_SUBNAV.map((cat) => ({
        to: `/repositories/${cat.slug}`,
        label: cat.label,
        active: isRepositoriesActive && activeRepoCategory === cat.slug,
      })),
    },
    {
      key: 'clinic',
      to: '/clinic',
      icon: <Calendar className="w-4 h-4 shrink-0" />,
      label: 'คลินิกวิจัย',
      active: pathname === '/clinic' || pathname === '/clinic/appointments',
      children: [
        { to: '/clinic', label: 'ขอรับคำปรึกษา', active: pathname === '/clinic' },
        { to: '/clinic/appointments', label: 'รวมคำขอจองนัดหมาย', active: pathname === '/clinic/appointments' },
      ],
    },
    {
      key: 'ethics',
      to: '/ethics',
      icon: <Clipboard className="w-4 h-4 shrink-0" />,
      label: 'จริยธรรมการวิจัย',
      active: pathname === '/ethics' || pathname === '/ethics/submissions',
      children: [
        { to: '/ethics', label: 'ยื่นโครงร่างวิจัย', active: pathname === '/ethics' },
        { to: '/ethics/submissions', label: 'รวมคำขอยื่น', active: pathname === '/ethics/submissions' },
      ],
    },
    {
      key: 'ip-application',
      to: '/ip-application',
      icon: <Award className="w-4 h-4 shrink-0" />,
      label: 'ทรัพย์สินทางปัญญา',
      active: pathname === '/ip-application' || pathname === '/ip-application/list',
      children: [
        { to: '/ip-application', label: 'ยื่นขอขึ้นทะเบียน', active: pathname === '/ip-application' },
        { to: '/ip-application/list', label: 'รวมคำขอยื่น', active: pathname === '/ip-application/list' },
      ],
    },
    ...(hasRole(profile?.role, 'admin')
      ? [{
          key: 'masterdata',
          to: '/master',
          icon: <Settings className="w-4 h-4 shrink-0" />,
          label: 'Masterdata',
          active: isMasterdataActive,
          children: MASTERDATA_SUBNAV.map((sub) => {
            if (sub.isHeader) {
              return {
                isHeader: true,
                label: sub.label,
                to: '',
                active: false,
              }
            }
            return {
              isHeader: false,
              to: sub.slug ? `/master/${sub.slug}` : '/master',
              label: sub.label,
              active: isMasterdataActive && (activeMasterdataSlug === sub.slug || (activeMasterdataSlug === '' && sub.slug === '')),
            }
          }),
        } as SidebarItem]
      : []),
  ]

  const isGroupExpanded = (item: SidebarItem) => expandedGroups[item.key] ?? item.active
  const toggleGroup = (key: string, currentlyExpanded: boolean) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !currentlyExpanded }))

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-white border-r border-[#E2E8F0] min-h-screen justify-between p-4 shadow-sm">
        <div className="space-y-4">
          {/* Brand Logo Header */}
          <Link href="/" className="flex items-center gap-3 h-14 px-2 cursor-pointer select-none group">
            <img
              src="/smnc_logo.png"
              alt="SMNC Logo"
              className="w-10 h-10 rounded-2xl object-cover shadow-md shrink-0 border border-teal-100 group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-[#0F172A] leading-none tracking-tight">คลังปัญญา SMNC</span>
              </div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#64748B] block mt-1">
                DIGITAL RESEARCH WORKSPACE
              </span>
            </div>
          </Link>


          {/* Navigation Items */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              if (!item.children) {
                return (
                  <Link key={item.key} href={item.to} className={sidebarLinkClass(item.active)}>
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              }

              const expanded = isGroupExpanded(item)
              return (
                <div key={item.key} className="space-y-1">
                  <div
                    className={`flex items-center justify-between rounded-full transition-all duration-200 ${
                      item.active
                        ? 'bg-[#00796B] text-white shadow-md shadow-[#00796B]/20'
                        : 'text-[#0F172A] hover:bg-[#F1F5F9] hover:text-[#00796B]'
                    }`}
                  >
                    <Link
                      href={item.to}
                      className="px-4 py-3 text-xs font-extrabold flex items-center gap-3 flex-1 min-w-0"
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.key, expanded)}
                      aria-label={expanded ? 'ย่อเมนูย่อย' : 'ขยายเมนูย่อย'}
                      className={`pr-3.5 pl-1 shrink-0 flex items-center justify-center cursor-pointer ${
                        item.active ? 'text-white' : 'text-[#94A3B8] hover:text-[#0F172A]'
                      }`}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {expanded && (
                    <div className="mt-1.5 ml-5 pl-4 space-y-1.5 border-l-2 border-[#E2E8F0]">
                      {item.children.map((child, cIdx) => {
                        if (child.isHeader) {
                          return (
                            <div key={`header-${cIdx}`} className="pt-2 pb-1 text-[9px] font-black uppercase tracking-wider text-[#94A3B8]">
                              {child.label}
                            </div>
                          )
                        }
                        return (
                          <Link
                            key={child.to}
                            href={child.to}
                            className={`block px-4 py-2.5 rounded-full text-xs transition-all duration-200 ${
                              child.active
                                ? 'text-[#D97706] bg-[#FFF8E7] border border-[#FCD34D] font-black shadow-xs'
                                : 'text-[#0F172A] font-extrabold hover:text-[#00796B] hover:bg-[#F1F5F9]'
                            }`}
                          >
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Bottom Action CTA */}
        <div className="pt-4 border-t border-[#E2E8F0]">
          <Link
            href="/clinic"
            className="w-full btn-gold text-xs flex items-center justify-center gap-2 !py-3"
          >
            <Zap className="w-4 h-4 fill-[#0F172A] stroke-[#0F172A]" />
            <span>ขอคำปรึกษาด่วน</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Menu (Visible on mobile screens < md) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] shadow-lg flex items-center justify-around py-1.5 px-1 md:hidden">
        {navItems.map((item) => {
          const shortLabelMap: Record<string, string> = {
            dashboard: 'หน้าหลัก',
            repositories: 'คลังปัญญา',
            clinic: 'คลินิกวิจัย',
            ethics: 'จริยธรรม',
            'ip-application': 'ทรัพย์สิน IP',
            masterdata: 'ตั้งค่า',
          }
          const shortLabel = shortLabelMap[item.key] || item.label

          return (
            <Link
              key={item.key}
              href={item.to}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 transition-all rounded-xl ${
                item.active
                  ? 'text-[#00796B] font-extrabold bg-[#F0F7FF]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <div className={item.active ? 'text-[#00796B]' : 'text-[#64748B]'}>
                {item.icon}
              </div>
              <span className="text-[10px] font-extrabold mt-0.5 leading-none truncate max-w-[62px] text-center">
                {shortLabel}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
