'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

const supabase = createClient()

import { RolePermission, isPageAllowedForUser, hasRole } from '@/utils/roleHelper'

/**
 * Canonical top-level page-key list, mirrored from Sidebar.tsx's rawNavItems
 * (dashboard, repositories, clinic, ethics, ip_application, masterdata).
 * Kept in sync manually since Sidebar builds this list inline with JSX icons.
 */
const ALL_PAGE_KEYS = ['dashboard', 'repositories', 'clinic', 'ethics', 'ip_application', 'masterdata']

export interface Profile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'teacher' | 'expert' | string
  created_at: string
  is_temp_account?: boolean
  temp_expires_at?: string
  temp_target_submission_id?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  permissions: RolePermission[]
  isPageAllowed: (pageKey: string) => boolean
  signOut: () => Promise<void>
  refreshPermissions: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase.from('role_permissions').select('*')
      if (!error && data) {
        setPermissions(data as RolePermission[])
      }
    } catch (err) {
      console.error('Error fetching role permissions:', err)
    }
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) throw error
      if (data) {
        setProfile(data as Profile)
      } else {
        // Retry logic in case profile trigger is slightly delayed
        setTimeout(async () => {
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()
          if (retryData) setProfile(retryData as Profile)
        }, 1500)
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
  }

  useEffect(() => {
    fetchPermissions()

    // Realtime listener for role_permissions table updates
    const channel = supabase
      .channel('role_permissions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'role_permissions' },
        () => {
          fetchPermissions()
        }
      )
      .subscribe()

    // 1. Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        console.error('Error getting session:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setLoading(false)
    toast.success('ออกจากระบบสำเร็จ')
  }

  const isPageAllowed = (pageKey: string): boolean => {
    return isPageAllowedForUser(profile?.role, pageKey, permissions)
  }

  // Zero-access redirect guard: once profile + permissions are both resolved,
  // check if the logged-in user's role has zero accessible pages across the
  // full page-key list Sidebar.tsx consumes. Admin always bypasses (hasRole
  // short-circuits true for admin — see roleHelper.ts).
  useEffect(() => {
    if (loading) return
    if (!user || !profile) return
    if (permissions.length === 0) return
    if (hasRole(profile.role, 'admin')) return

    const hasAnyAccess = ALL_PAGE_KEYS.some((pageKey) =>
      isPageAllowedForUser(profile.role, pageKey, permissions)
    )

    if (!hasAnyAccess) {
      toast.error('บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้าใดๆ กรุณาติดต่อผู้ดูแลระบบ')
      router.push('/login')
    }
  }, [loading, user, profile, permissions, router])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        permissions,
        isPageAllowed,
        signOut,
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
