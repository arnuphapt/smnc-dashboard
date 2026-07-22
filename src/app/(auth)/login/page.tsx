'use client'

import React, { useEffect } from 'react'
import { AuthScreen } from '@/components/views/AuthScreen'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.replace('/')
    }
  }, [user, router])

  if (user) {
    return null
  }

  return (
    <div className="relative min-h-screen">
      <button
        type="button"
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 z-50 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 transition shadow-sm cursor-pointer"
      >
        ← กลับหน้าเว็บหลัก
      </button>
      <AuthScreen />
    </div>
  )
}
