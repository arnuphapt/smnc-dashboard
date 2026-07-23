'use client'

import React from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-grow w-full px-4 sm:px-6 py-6 pb-20 md:pb-6">
          {children}
        </main>
        <footer className="bg-white py-6 border-t border-slate-200 mt-12 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} คลังปัญญาดิจิทัล วิทยาลัยพยาบาลศรีมหาสารคาม. All rights reserved.</p>
          <p className="mt-1 text-slate-400">พัฒนาด้วย Next.js 16 App Router และ Supabase SSR</p>
        </footer>
      </div>
    </div>
  )
}
