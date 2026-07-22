'use client'

import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { hasRole } from '@/utils/roleHelper'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

const AccessDenied: React.FC = () => (
  <div
    className="py-20 text-center rounded-2xl p-8 max-w-md mx-auto space-y-4 my-12"
    style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}
  >
    <Shield className="w-16 h-16 mx-auto stroke-[1.5]" style={{ color: '#0EA5A0' }} />
    <h3 className="text-lg font-bold" style={{ color: '#0B1D3A' }}>
      การเข้าถึงถูกปฏิเสธ
    </h3>
    <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
      ขออภัย เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเข้าถึงระบบหลังบ้านได้
    </p>
    <Link href="/" className="btn-primary px-6 py-2 inline-block">
      กลับหน้าหลัก
    </Link>
  </div>
)

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, loading } = useAuth()

  if (loading) return null

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-grow w-full px-4 sm:px-6 py-6">
          {!hasRole(profile?.role, 'admin') ? <AccessDenied /> : children}
        </main>
        <footer className="bg-white py-6 border-t border-slate-200 mt-12 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} คลังปัญญาดิจิทัล วิทยาลัยพยาบาลศรีมหาสารคาม. All rights reserved.</p>
          <p className="mt-1 text-slate-400">พัฒนาด้วย Next.js 16 App Router และ Supabase SSR</p>
        </footer>
      </div>
    </div>
  )
}
