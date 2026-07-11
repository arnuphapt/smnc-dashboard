import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LookupProvider } from './context/LookupContext'
import { AuthScreen } from './pages/AuthScreen'
import { Dashboard } from './pages/Dashboard'
import { Repositories } from './pages/Repositories'
import { AdminPanel } from './pages/AdminPanel'
import { Shield, BookOpen, LayoutDashboard, LogIn, LogOut, Settings } from 'lucide-react'

const AppContent: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [showAuthScreen, setShowAuthScreen] = useState(false)

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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-700 flex items-center justify-center shadow shadow-cyan-600/10">
              <Shield className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-950 block leading-none">คลังปัญญา SMNC</span>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Digital Research Workspace</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'dashboard' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              สรุปภาพรวม (Dashboard)
            </button>
            <button
              onClick={() => setActiveTab('research')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                ['research', 'innovation', 'intellectual_property', 'award', 'utilization'].includes(activeTab)
                  ? 'bg-cyan-50 text-cyan-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              คลังปัญญา 5 ด้าน
            </button>
            {profile?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'admin' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <Settings className="w-4 h-4" />
                หลังบ้าน Admin
              </button>
            )}
          </nav>

          {/* User Auth Badge */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-100/50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-700 max-w-[120px] truncate">{user.email}</div>
                  <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-1.5 rounded mt-0.5 ${getRoleBadgeColor(profile?.role)}`}>
                    {profile?.role || 'TEACHER'}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-red-650 transition"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthScreen(true)}
                className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all transform hover:-translate-y-0.5 active:translate-y-0"
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
