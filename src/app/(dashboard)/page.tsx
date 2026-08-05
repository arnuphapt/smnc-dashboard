'use client'

import React from 'react'
import { Dashboard } from '@/components/views/Dashboard'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useRequirePageAccess } from '@/hooks/useRequirePageAccess'

export default function HomePage() {
  useRequirePageAccess('dashboard')
  const router = useRouter()
  const { profile } = useAuth()

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
