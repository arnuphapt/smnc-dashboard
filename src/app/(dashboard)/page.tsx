'use client'

import React, { useEffect } from 'react'
import { Dashboard } from '@/components/views/Dashboard'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { isPageAllowedForUser, getDefaultRouteForUser } from '@/utils/roleHelper'

export default function HomePage() {
  const router = useRouter()
  const { user, profile, permissions, loading } = useAuth()

  const isAllowed = isPageAllowedForUser(profile?.role, 'dashboard', permissions)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!isAllowed) {
      const targetRoute = getDefaultRouteForUser(profile?.role, permissions)
      if (targetRoute !== '/') {
        router.replace(targetRoute)
      }
    }
  }, [loading, user, isAllowed, profile, permissions, router])

  if (loading || !user || !isAllowed) {
    return null
  }

  const handleDashboardNavigate = (tab: string) => {
    const REPOSITORY_CATEGORIES = ['research', 'innovation', 'intellectual_property', 'award', 'utilization']
    if (REPOSITORY_CATEGORIES.includes(tab)) {
      router.push(`/repositories/${tab}`)
    } else {
      router.push(`/${tab}`)
    }
  }

  return <Dashboard onNavigate={handleDashboardNavigate} userRole={profile?.role} />
}

