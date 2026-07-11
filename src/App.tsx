import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LookupProvider } from './context/LookupContext'
import { AuthScreen } from './pages/AuthScreen'
import { Dashboard } from './pages/Dashboard'
import { Repositories } from './pages/Repositories'
import { AdminPanel } from './pages/AdminPanel'
import { Shield, BookOpen, LayoutDashboard, LogIn, LogOut, Settings, ChevronDown } from 'lucide-react'

const AppContent: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [showAuthScreen, setShowAuthScreen] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-cyan-400 font-bold tracking-wide animate-pulse">กำลังดาวน์โหลดข้อมูลระบบ...</p>
      </div>
    )
  }

  // Handle nav direction from dashboard card clicks
  const handleDashboardNavigate = (tab: string) => {
    setActiveTab(tab)
  }

  // Active page selector
  const renderActivePage = () => {
    if (activeTab === 'dashboard') {
      return <Dashboard onNavigate={handleDashboardNavigate} userRole={profile?.role} />
    }

    if (activeTab === 'admin') {
      if (profile?.role === 'admin') {
        return <AdminPanel />
      } else {
        return (
          <div className="py-20 text-center glass-card rounded-2xl border border-slate-800 p-8 max-w-md mx-auto space-y-4">
            <Shield className="w-16 h-16 text-red-500 mx-auto stroke-[1.5]" />
            <h3 className="text-lg font-bold text-white">การเข้าถึงถูกปฏิเสธ</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              ขออภัย เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเข้าถึงระบบหลังบ้านและจัดการตัวเลือกต่างๆ ได้
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition"
            >
              กลับหน้าหลัก
            </button>
          </div>
        )
      }
    }

    // 5 Wisdom Repositories (research, innovation, intellectual_property, award, utilization)
    return <Repositories initialCategory={activeTab} />
  }

  const getRoleBadgeColor = (role?: string) => {
    if (role === 'admin') return 'bg-red-50 text-red-700 border border-red-200/60'
    if (role === 'expert') return 'bg-purple-50 text-purple-700 border border-purple-200/60'
    return 'bg-cyan-50 text-cyan-700 border border-cyan-200/60'
  }

  if (showAuthScreen && !user) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowAuthScreen(false)}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-900 to-cyan-600 flex items-center justify-center shadow-md shadow-blue-900/10">
              <Shield className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-950 block leading-none tracking-tight">คลังปัญญา SMNC</span>
              <span className="text-[10px] text-slate-500 block mt-1 font-bold tracking-wide uppercase">Digital Research Workspace</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'dashboard' ? 'bg-blue-50 text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              สรุปภาพรวม (Dashboard)
            </button>
            <button
              onClick={() => setActiveTab('research')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                ['research', 'innovation', 'intellectual_property', 'award', 'utilization'].includes(activeTab)
                  ? 'bg-blue-50 text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              คลังปัญญา 5 ด้าน
            </button>
            {profile?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'admin' ? 'bg-blue-50 text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <Settings className="w-4 h-4" />
                หลังบ้าน Admin
              </button>
            )}
          </nav>

          {/* User Auth Badge with Dropdown */}
          <div className="relative">
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-900 to-cyan-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0">
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
                      <button
                        onClick={() => {
                          setActiveTab('dashboard')
                          setShowProfileDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        สรุปภาพรวม (Dashboard)
                      </button>
                      
                      {profile?.role === 'admin' && (
                        <button
                          onClick={() => {
                            setActiveTab('admin')
                            setShowProfileDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          หลังบ้าน Admin
                        </button>
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
              <button
                onClick={() => setShowAuthScreen(true)}
                className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-white stroke-[2.5]" />
                เข้าสู่ระบบ / สมัครสมาชิก
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActivePage()}
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
