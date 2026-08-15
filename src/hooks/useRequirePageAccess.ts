'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { isPageAllowedForUser, getDefaultRouteForUser } from '@/utils/roleHelper'

/**
 * Route-level access guard. Mirrors the fire-and-forget redirect pattern
 * already used by AuthContext.tsx's zero-access effect: gates on `!loading`,
 * does not block rendering, just fires a redirect (+ toast when applicable).
 *
 * Call as the first line of a page component's body:
 *   useRequirePageAccess('clinic_request')
 */
export function useRequirePageAccess(pageKey: string): void {
  const router = useRouter()
  const { user, profile, permissions, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (!isPageAllowedForUser(profile?.role, pageKey, permissions)) {
      toast.error('ไม่มีสิทธิ์เข้าถึงหน้านี้')
      const defaultRoute = getDefaultRouteForUser(profile?.role, permissions)
      router.push(defaultRoute)
    }
  }, [loading, user, profile, permissions, pageKey, router])
}

