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
  Bell,
  HelpCircle,
  Search
} from 'lucide-react'

export const Topbar: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Search Input (Neutral High-Contrast Slate Black) */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="ค้นหาข้อมูล คลังผลงาน หรือเอกสาร..."
            className="w-full pl-10 pr-4 py-2 rounded-full text-xs font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#0F172A] transition"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        <button type="button" className="p-2 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition cursor-pointer" title="การแจ้งเตือน">
          <Bell className="w-4.5 h-4.5" />
        </button>
        <button type="button" className="p-2 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition cursor-pointer" title="ช่วยเหลือ">
          <HelpCircle className="w-4.5 h-4.5" />
        </button>

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              <div className="text-right leading-none hidden sm:block">
                <div className="text-xs font-black text-[#0F172A] max-w-[140px] truncate" title={user.email || ''}>
                  {user.email}
                </div>
                <div className="mt-1">
                  <StatusBadge status={profile?.role || 'teacher'} size="sm" />
                </div>
              </div>
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#005F5A] to-[#00796B] text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 border-2 border-white"
              >
                {user.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProfileDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl py-2 z-50 text-xs text-[#0F172A] animate-fadeIn space-y-1">
                  <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] rounded-t-3xl">
                    <div className="font-black text-[#0F172A] truncate" title={user.email || ''}>{user.email}</div>
                    <div className="text-[10px] font-mono font-bold uppercase text-[#64748B] mt-1">สิทธิ์: {formatUserRolesText(profile?.role)}</div>
                  </div>

                  <div className="py-1 px-1">
                    <Link
                      href="/"
                      onClick={() => setShowProfileDropdown(false)}
                      className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-[#F8FAFC] font-extrabold text-[#0F172A] flex items-center gap-2.5 transition cursor-pointer group"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
                      สรุปภาพรวม (Dashboard)
                    </Link>

                    <Link
                      href="/clinic"
                      onClick={() => setShowProfileDropdown(false)}
                      className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-[#F8FAFC] font-extrabold text-[#0F172A] flex items-center gap-2.5 transition cursor-pointer group"
                    >
                      <Calendar className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
                      คลินิกวิจัย (Clinic)
                    </Link>

                    <Link
                      href="/ethics"
                      onClick={() => setShowProfileDropdown(false)}
                      className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-[#F8FAFC] font-extrabold text-[#0F172A] flex items-center gap-2.5 transition cursor-pointer group"
                    >
                      <Clipboard className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
                      จริยธรรมการวิจัย (Ethics)
                    </Link>

                    <Link
                      href="/ip-application"
                      onClick={() => setShowProfileDropdown(false)}
                      className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-[#F8FAFC] font-extrabold text-[#0F172A] flex items-center gap-2.5 transition cursor-pointer group"
                    >
                      <Award className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
                      ทรัพย์สินทางปัญญา (IP)
                    </Link>

                    {hasRole(profile?.role, 'admin') && (
                      <Link
                        href="/master"
                        onClick={() => setShowProfileDropdown(false)}
                        className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-[#F8FAFC] font-extrabold text-[#0F172A] flex items-center gap-2.5 transition cursor-pointer group"
                      >
                        <Settings className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A]" />
                        Masterdata Console
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-[#E2E8F0] my-1"></div>

                  <div className="py-1 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        signOut()
                        setShowProfileDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-[#FFE4E6] font-extrabold text-[#E11D48] flex items-center gap-2.5 transition cursor-pointer"
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
          <Link href="/login" className="btn-gold text-xs flex items-center gap-1.5 !py-2 !px-4">
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </header>
  )
}
