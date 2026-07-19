import React, { useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LookupProvider } from './context/LookupContext'
import { hasRole, formatUserRolesText } from './utils/roleHelper'
import { AuthScreen } from './pages/AuthScreen'
import { Dashboard } from './pages/Dashboard'
import { Repositories } from './pages/Repositories'
import { MasterdataPanel } from './pages/MasterdataPanel'
import { Clinic } from './pages/Clinic'
import { Ethics } from './pages/Ethics'
import { IPApplication } from './pages/IPApplication'
import { Shield, BookOpen, LayoutDashboard, LogIn, LogOut, Settings, ChevronDown, Calendar, Clipboard, Award, Lightbulb, FileCheck, Share2, Users, LayoutGrid } from 'lucide-react'

const REPOSITORY_CATEGORIES = ['research', 'innovation', 'intellectual_property', 'award', 'utilization']

const REPOSITORY_SUBNAV = [
  { slug: 'research', icon: BookOpen, label: 'คลังผลงานวิจัย' },
  { slug: 'innovation', icon: Lightbulb, label: 'คลังนวัตกรรม' },
  { slug: 'intellectual_property', icon: FileCheck, label: 'คลังทรัพย์สินทางปัญญา' },
  { slug: 'award', icon: Award, label: 'คลังรางวัลและความสำเร็จ' },
  { slug: 'utilization', icon: Share2, label: 'การนำไปใช้ประโยชน์' },
]

const MASTERDATA_SUBNAV = [
  { isHeader: true, label: 'Overview & Settings' },
  { slug: '', icon: LayoutGrid, label: 'Master Overview' },
  { slug: 'lookups/research_type', icon: Settings, label: 'Master Research Type' },
  { slug: 'lookups/department', icon: Settings, label: 'Master Department' },
  { slug: 'lookups/ip_type', icon: Settings, label: 'Master IP Type' },
  { slug: 'lookups/award_level', icon: Settings, label: 'Master Award Level' },
  { slug: 'lookups/utilization_type', icon: Settings, label: 'Master Utilization Type' },
  { slug: 'lookups/journal_rank', icon: Settings, label: 'Master Journal Rank' },
  { slug: 'lookups/scope', icon: Settings, label: 'Master Scope' },
  { slug: 'lookups/innovation_type', icon: Settings, label: 'Master Innovation Type' },
  { slug: 'lookups/source', icon: Settings, label: 'Master Source' },
  { slug: 'lookups/ip_current_status', icon: Settings, label: 'Master IP Status' },
  { slug: 'lookups/venue', icon: Settings, label: 'Master Venue' },
  { slug: 'lookups/year', icon: Settings, label: 'Master Year' },
  { slug: 'lookups/ethics_criteria', icon: Settings, label: 'Master Ethics Criteria' },
  { slug: 'users', icon: Users, label: 'Master Users' },
  { slug: 'roles', icon: Shield, label: 'Master Roles' },
  { isHeader: true, label: 'Service Queues' },
  { slug: 'clinic', icon: Calendar, label: 'Master Clinic' },
  { slug: 'ethics', icon: Clipboard, label: 'Master Ethics' },
  { slug: 'ip', icon: Award, label: 'Master IP' },
  { isHeader: true, label: 'Content Management' },
  { slug: 'items/research', icon: BookOpen, label: 'Master Research' },
  { slug: 'items/innovation', icon: Lightbulb, label: 'Master Innovation' },
  { slug: 'items/intellectual_property', icon: FileCheck, label: 'Master IP' },
  { slug: 'items/award', icon: Award, label: 'Master Award' },
  { slug: 'items/utilization', icon: Share2, label: 'Master Utilization' },
]

const AccessDenied: React.FC = () => (
  <div className="py-20 text-center rounded-2xl p-8 max-w-md mx-auto space-y-4" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}>
    <Shield className="w-16 h-16 mx-auto stroke-[1.5]" style={{ color: '#0EA5A0' }} />
    <h3 className="text-lg font-bold" style={{ color: '#0B1D3A' }}>การเข้าถึงถูกปฏิเสธ</h3>
    <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
      ขออภัย เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเข้าถึงระบบหลังบ้านได้
    </p>
    <Link to="/" className="btn-primary px-6 py-2 inline-block">
      กลับหน้าหลัก
    </Link>
  </div>
)

const AppContent: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#F0F7FF' }}>
        <div className="spinner-teal"></div>
        <p className="text-sm font-medium animate-pulse" style={{ color: '#64748B' }}>กำลังดาวน์โหลดข้อมูลระบบ...</p>
      </div>
    )
  }

  const handleDashboardNavigate = (tab: string) => {
    if (REPOSITORY_CATEGORIES.includes(tab)) {
      navigate(`/repositories/${tab}`)
    } else {
      navigate(`/${tab}`)
    }
  }

  const getRoleBadgeColor = (role?: string) => {
    if (role === 'admin') return 'bg-red-50 text-red-700 border border-red-200/60'
    if (role === 'expert') return 'bg-purple-50 text-purple-700 border border-purple-200/60'
    return 'bg-teal-50 text-teal-700 border border-teal-200/60'
  }

  const sidebarLinkClass = (active: boolean) =>
    `px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-3 border-l-[3px] ${active ? '' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 border-transparent'
    }`

  const sidebarLinkStyle = (active: boolean): React.CSSProperties | undefined =>
    active ? { background: 'rgba(14,165,160,0.12)', color: '#0B1D3A', borderLeftColor: '#0EA5A0' } : undefined

  const isRepositoriesActive = location.pathname.startsWith('/repositories')
  const isMasterdataActive = location.pathname.startsWith('/master')
  const activeRepoCategory = location.pathname.split('/')[2] || 'research'
  const activeMasterdataSlug = location.pathname === '/master' ? '' : location.pathname.split('/')[2] || ''

  interface SidebarChild { to: string; label: string; active: boolean; isHeader?: boolean }
  interface SidebarItem { key: string; to: string; icon: React.ReactNode; label: string; active: boolean; children?: SidebarChild[] }

  const navItems: SidebarItem[] = [
    { key: 'dashboard', to: '/', icon: <LayoutDashboard className="w-4 h-4 shrink-0" />, label: 'สรุปภาพรวม (Dashboard)', active: location.pathname === '/' },
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
      active: location.pathname === '/clinic'
    },
    {
      key: 'ethics',
      to: '/ethics',
      icon: <Clipboard className="w-4 h-4 shrink-0" />,
      label: 'จริยธรรมการวิจัย',
      active: location.pathname === '/ethics'
    },
    {
      key: 'ip-application',
      to: '/ip-application',
      icon: <Award className="w-4 h-4 shrink-0" />,
      label: 'ทรัพย์สินทางปัญญา',
      active: location.pathname === '/ip-application'
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
              active: false
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

  if (location.pathname === '/login') {
    if (user) return <Navigate to="/" replace />
    return (
      <div className="relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 z-50 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 transition shadow-sm"
        >
          ← กลับหน้าเว็บหลัก
        </button>
        <AuthScreen />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-white border-r border-slate-200">
        <Link to="/" className="flex items-center gap-3 h-16 px-5 border-b border-slate-200 shrink-0 cursor-pointer select-none">
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
                <Link key={item.key} to={item.to} className={sidebarLinkClass(item.active)} style={sidebarLinkStyle(item.active)}>
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
                    to={item.to}
                    className={`px-3 py-2.5 text-xs font-bold transition-all duration-200 flex items-center gap-3 flex-1 min-w-0 ${item.active ? '' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-xl'
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
                          <div
                            key={cIdx}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-400/80 mt-3 mb-1 px-3 first:mt-1 select-none"
                          >
                            {child.label}
                          </div>
                        )
                      }
                      return (
                        <Link
                          key={child.to}
                          to={child.to}
                          className={`block px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors duration-200 truncate ${child.active ? '' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                            }`}
                          style={child.active ? { background: 'rgba(14,165,160,0.1)', color: '#0B1D3A' } : undefined}
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

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Compact brand — only visible when sidebar is hidden (mobile) */}
            <Link to="/" className="md:hidden flex items-center gap-2.5 cursor-pointer select-none shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md shrink-0" style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #0EA5A0 100%)' }}>
                <Shield className="w-4 h-4 text-white stroke-[2.5]" />
              </div>
              <span className="text-sm font-extrabold text-slate-950 tracking-tight">คลังปัญญาดิจิตอล SMNC</span>
            </Link>
            <div className="hidden md:block" />

            {/* User Auth Badge with Dropdown */}
            <div className="relative shrink-0">
              {user ? (
                <>
                  {/* Trigger Button */}
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2.5 bg-transparent hover:bg-slate-50 px-3 py-1.5 rounded-xl transition cursor-pointer select-none"
                  >
                    <div className="text-right leading-none">
                      <div className="text-xs font-extrabold text-slate-800 max-w-[130px] truncate" title={user.email}>
                        {user.email}
                      </div>
                      <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 ${getRoleBadgeColor(profile?.role)}`}>
                        {formatUserRolesText(profile?.role)}
                      </span>
                    </div>
                    <div
                      className="w-8 h-8 rounded-full text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0"
                      style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #0EA5A0 100%)' }}
                    >
                      {user.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Overlay to close when clicking outside */}
                  {showProfileDropdown && (
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setShowProfileDropdown(false)}
                    />
                  )}

                  {/* Floating Dropdown Card */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-fadeIn text-xs text-slate-700">
                      <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100">
                        <div className="font-bold text-slate-900 truncate" title={user.email}>{user.email}</div>
                        <div className="text-[9px] font-extrabold uppercase text-slate-400 mt-1">สิทธิ์: {formatUserRolesText(profile?.role)}</div>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/"
                          onClick={() => setShowProfileDropdown(false)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          สรุปภาพรวม (Dashboard)
                        </Link>

                        <Link
                          to="/clinic"
                          onClick={() => setShowProfileDropdown(false)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-slate-400" />
                          คลินิกวิจัย (Clinic)
                        </Link>

                        <Link
                          to="/ethics"
                          onClick={() => setShowProfileDropdown(false)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Clipboard className="w-4 h-4 text-slate-400" />
                          จริยธรรมการวิจัย (Ethics)
                        </Link>

                        <Link
                          to="/ip-application"
                          onClick={() => setShowProfileDropdown(false)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Award className="w-4 h-4 text-slate-400" />
                          ทรัพย์สินทางปัญญา (IP)
                        </Link>

                        {hasRole(profile?.role, 'admin') && (
                          <Link
                            to="/master"
                            onClick={() => setShowProfileDropdown(false)}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                          >
                            <Settings className="w-4 h-4 text-slate-400" />
                            Masterdata Console
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-150 my-1"></div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            signOut()
                            setShowProfileDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 font-bold text-red-600 flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          ออกจากระบบ
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link to="/login" className="btn-primary text-xs flex items-center gap-1.5 !py-2 !px-4">
                  <LogIn className="w-4 h-4 text-white stroke-[2.5]" />
                  เข้าสู่ระบบ / สมัครสมาชิก
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow w-full px-4 sm:px-6 py-6">
          <Routes>
            <Route path="/" element={<Dashboard onNavigate={handleDashboardNavigate} userRole={profile?.role} />} />
            <Route path="/repositories" element={<Navigate to="/repositories/research" replace />} />
            <Route path="/repositories/:category" element={<Repositories />} />
            <Route path="/clinic" element={<Clinic />} />
            <Route path="/ethics" element={<Ethics />} />
            <Route path="/ip-application" element={<IPApplication />} />
            <Route path="/master/*" element={hasRole(profile?.role, 'admin') ? <MasterdataPanel /> : <AccessDenied />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white py-6 border-t border-slate-200 mt-12 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} คลังปัญญาดิจิทัล วิทยาลัยพยาบาลศรีมหาสารคาม. All rights reserved.</p>
          <p className="mt-1 text-slate-400">พัฒนาแบบเรียลไทม์ประสิทธิภาพสูงสำหรับจัดเก็บวิจัยและนวัตกรรม</p>
        </footer>
      </div>
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LookupProvider>
        <AppContent />
      </LookupProvider>
    </AuthProvider>
  )
}
