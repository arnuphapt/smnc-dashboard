'use client'

import React, { useEffect, Suspense } from 'react'
import { AuthScreen } from '@/components/views/AuthScreen'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { isPageAllowedForUser, getDefaultRouteForUser } from '@/utils/roleHelper'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function LoginContent() {
  const { user, profile, permissions, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const isExpired = searchParams ? searchParams.get('expired') === '1' : false
  const redirectTarget = searchParams ? searchParams.get('redirect') : null

  useEffect(() => {
    if (user && !isExpired && !loading) {
      if (redirectTarget) {
        router.replace(decodeURIComponent(redirectTarget))
      } else {
        const targetRoute = getDefaultRouteForUser(profile?.role, permissions)
        router.replace(targetRoute)
      }
    }
  }, [user, profile, permissions, loading, router, redirectTarget, isExpired])

  if (user && !isExpired) {
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

      {isExpired && (
        <div className="max-w-md mx-auto pt-16 px-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-amber-950">บัญชีผู้ทรงคุณวุฒิชั่วคราวหมดอายุแล้ว</div>
              <div className="mt-0.5 text-amber-800">
                สิทธิ์การเข้าใช้งานแบบชั่วคราวของคุณสิ้นสุดลงแล้ว หากต้องการเข้าสู่ระบบใหม่ กรุณาติดต่อผู้ดูแลระบบเพื่อขอรับสิทธิ์เข้าใช้งานอีกครั้งค่ะ
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthScreen />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">กำลังโหลด...</div>}>
      <LoginContent />
    </Suspense>
  )
}
