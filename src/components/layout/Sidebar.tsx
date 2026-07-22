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
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const { profile } = useAuth()
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const sidebarLinkClass = (active: boolean) =>
    `px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-3 border-l-[3px] ${
      active
        ? ''
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 border-transparent'
    }`

  const sidebarLinkStyle = (active: boolean): React.CSSProperties | undefined =>
    active ? { background: 'rgba(14,165,160,0.12)', color: '#0B1D3A', borderLeftColor: '#0EA5A0' } : undefined

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
      active: pathname === '/clinic',
    },
    {
      key: 'ethics',
      to: '/ethics',
      icon: <Clipboard className="w-4 h-4 shrink-0" />,
      label: 'จริยธรรมการวิจัย',
      active: pathname === '/ethics',
    },
    {
      key: 'ip-application',
      to: '/ip-application',
      icon: <Award className="w-4 h-4 shrink-0" />,
      label: 'ทรัพย์สินทางปัญญา',
      active: pathname === '/ip-application',
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
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-white border-r border-slate-200 min-h-screen">
      <Link href="/" className="flex items-center gap-3 h-16 px-5 border-b border-slate-200 shrink-0 cursor-pointer select-none">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0" style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #0EA5A0 100%)' }}>
          <Shield className="w-5 h-5 text-white stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-extrabold text-slate-950 block leading-none tracking-tight truncate">คลังปัญญา SMNC</span>
          <span className="text-[9px] text-slate-500 block mt-1 font-bold tracking-wide uppercase truncate">Digital Research Workspace</span>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          if (!item.children) {
            return (
              <Link key={item.key} href={item.to} className={sidebarLinkClass(item.active)} style={sidebarLinkStyle(item.active)}>
                {item.icon}
                {item.label}
              </Link>
            )
          }

          const expanded = isGroupExpanded(item)
          return (
            <div key={item.key}>
              <div
                className={`flex items-stretch rounded-xl border-l-[3px] ${item.active ? '' : 'border-transparent'}`}
                style={item.active ? { background: 'rgba(14,165,160,0.12)', borderLeftColor: '#0EA5A0' } : undefined}
              >
                <Link
                  href={item.to}
                  className={`px-3 py-2.5 text-xs font-bold transition-all duration-200 flex items-center gap-3 flex-1 min-w-0 ${
                    item.active ? '' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-xl'
                  }`}
                  style={item.active ? { color: '#0B1D3A' } : undefined}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleGroup(item.key, expanded)}
                  aria-label={expanded ? 'ย่อเมนูย่อย' : 'ขยายเมนูย่อย'}
                  className="pr-3 pl-1 shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {expanded && (
                <div className="mt-1 ml-4 pl-3 space-y-0.5 border-l border-slate-200">
                  {item.children.map((child, cIdx) => {
                    if (child.isHeader) {
                      return (
                        <div key={`header-${cIdx}`} className="pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          {child.label}
                        </div>
                      )
                    }
                    return (
                      <Link
                        key={child.to}
                        href={child.to}
                        className={`block px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                          child.active ? 'text-teal-700 bg-teal-50 font-extrabold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
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
    </aside>
  )
}
