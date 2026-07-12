import React, { useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LookupProvider } from './context/LookupContext'
import { AuthScreen } from './pages/AuthScreen'
import { Dashboard } from './pages/Dashboard'
import { Repositories } from './pages/Repositories'
import { AdminPanel } from './pages/AdminPanel'
import { Clinic } from './pages/Clinic'
import { Ethics } from './pages/Ethics'
import { IPApplication } from './pages/IPApplication'
import { Shield, BookOpen, LayoutDashboard, LogIn, LogOut, Settings, ChevronDown, Calendar, Clipboard, Award } from 'lucide-react'

const REPOSITORY_CATEGORIES = ['research', 'innovation', 'intellectual_property', 'award', 'utilization']

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

  const navLinkClass = (active: boolean) =>
    `px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 border-b-2 ${
      active ? 'border-b-2' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 border-transparent'
    }`

  const navLinkStyle = (active: boolean): React.CSSProperties | undefined =>
    active ? { background: 'rgba(14,165,160,0.12)', color: '#0B1D3A', borderBottomColor: '#0EA5A0' } : undefined

  const isRepositoriesActive = location.pathname.startsWith('/repositories')

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-3 items-center">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer select-none justify-self-start">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #0EA5A0 100%)' }}>
              <Shield className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-950 block leading-none tracking-tight">คลังปัญญา SMNC</span>
              <span className="text-[10px] text-slate-500 block mt-1 font-bold tracking-wide uppercase">Digital Research Workspace</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center justify-center gap-2">
            <Link to="/" className={navLinkClass(location.pathname === '/')} style={navLinkStyle(location.pathname === '/')}>
              <LayoutDashboard className="w-4 h-4" />
              สรุปภาพรวม (Dashboard)
            </Link>
            <Link to="/repositories/research" className={navLinkClass(isRepositoriesActive)} style={navLinkStyle(isRepositoriesActive)}>
              <BookOpen className="w-4 h-4" />
              คลังปัญญา 5 ด้าน
            </Link>
            <Link to="/clinic" className={navLinkClass(location.pathname === '/clinic')} style={navLinkStyle(location.pathname === '/clinic')}>
              <Calendar className="w-4 h-4" />
              คลินิกวิจัย
            </Link>
            <Link to="/ethics" className={navLinkClass(location.pathname === '/ethics')} style={navLinkStyle(location.pathname === '/ethics')}>
              <Clipboard className="w-4 h-4" />
              จริยธรรมการวิจัย
            </Link>
            <Link to="/ip-application" className={navLinkClass(location.pathname === '/ip-application')} style={navLinkStyle(location.pathname === '/ip-application')}>
              <Award className="w-4 h-4" />
              ทรัพย์สินทางปัญญา
            </Link>
            {profile?.role === 'admin' && (
              <Link to="/admin" className={navLinkClass(location.pathname.startsWith('/admin'))} style={navLinkStyle(location.pathname.startsWith('/admin'))}>
                <Settings className="w-4 h-4" />
                หลังบ้าน Admin
              </Link>
            )}
          </nav>

          {/* User Auth Badge with Dropdown */}
          <div className="relative justify-self-end">
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
                      {profile?.role || 'TEACHER'}
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
                      <div className="text-[9px] font-extrabold uppercase text-slate-400 mt-1">สิทธิ์: {profile?.role || 'TEACHER'}</div>
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

                      {profile?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowProfileDropdown(false)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          หลังบ้าน Admin
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
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard onNavigate={handleDashboardNavigate} userRole={profile?.role} />} />
          <Route path="/repositories" element={<Navigate to="/repositories/research" replace />} />
          <Route path="/repositories/:category" element={<Repositories />} />
          <Route path="/clinic" element={<Clinic />} />
          <Route path="/ethics" element={<Ethics />} />
          <Route path="/ip-application" element={<IPApplication />} />
          <Route path="/admin/*" element={profile?.role === 'admin' ? <AdminPanel /> : <AccessDenied />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white py-6 border-t border-slate-200 mt-12 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} คลังปัญญาดิจิทัล วิทยาลัยพยาบาลศรีมหาสารคาม. All rights reserved.</p>
        <p className="mt-1 text-slate-400">ระบบพัฒนาแบบเรียลไทม์ประสิทธิภาพสูงสำหรับจัดเก็บวิจัยและนวัตกรรม</p>
      </footer>
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
