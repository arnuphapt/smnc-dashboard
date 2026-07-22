'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { formatUserRolesText, hasRole } from '@/utils/roleHelper'
import { StatusBadge } from '@/components/StatusBadge'
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  ChevronDown,
  Calendar,
  Clipboard,
  Award,
} from 'lucide-react'

export const Topbar: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  const getRoleBadgeColor = (role?: string) => {
    if (role === 'admin') return 'bg-red-50 text-red-700 border border-red-200/60'
    if (role === 'expert') return 'bg-purple-50 text-purple-700 border border-purple-200/60'
    return 'bg-teal-50 text-teal-700 border border-teal-200/60'
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-extrabold text-slate-800">ระบบบริหารจัดการงานวิจัยและนวัตกรรม</h1>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100/70 transition cursor-pointer"
            >
              <div className="text-right leading-none hidden sm:block">
                <div className="text-xs font-extrabold text-slate-800 max-w-[130px] truncate" title={user.email || ''}>
                  {user.email}
                </div>
                <div className="mt-1">
                  <StatusBadge status={profile?.role || 'teacher'} size="sm" />
                </div>
              </div>
              <div
                className="w-8 h-8 rounded-full text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0"
                style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #0EA5A0 100%)' }}
              >
                {user.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProfileDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs text-slate-700 animate-fadeIn">
                  <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100">
                    <div className="font-bold text-slate-900 truncate" title={user.email || ''}>{user.email}</div>
                    <div className="text-[9px] font-extrabold uppercase text-slate-400 mt-1">สิทธิ์: {formatUserRolesText(profile?.role)}</div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/"
                      onClick={() => setShowProfileDropdown(false)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      สรุปภาพรวม (Dashboard)
                    </Link>

                    <Link
                      href="/clinic"
                      onClick={() => setShowProfileDropdown(false)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-slate-400" />
                      คลินิกวิจัย (Clinic)
                    </Link>

                    <Link
                      href="/ethics"
                      onClick={() => setShowProfileDropdown(false)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Clipboard className="w-4 h-4 text-slate-400" />
                      จริยธรรมการวิจัย (Ethics)
                    </Link>

                    <Link
                      href="/ip-application"
                      onClick={() => setShowProfileDropdown(false)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-slate-400" />
                      ทรัพย์สินทางปัญญา (IP)
                    </Link>

                    {hasRole(profile?.role, 'admin') && (
                      <Link
                        href="/master"
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
                      type="button"
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
              </>
            )}
          </div>
        ) : (
          <Link href="/login" className="btn-primary text-xs flex items-center gap-1.5 !py-2 !px-4">
            <LogIn className="w-4 h-4 text-white stroke-[2.5]" />
            เข้าสู่ระบบ / สมัครสมาชิก
          </Link>
        )}
      </div>
    </header>
  )
}
