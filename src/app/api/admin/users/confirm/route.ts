import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { hasExactRole } from '@/utils/roleHelper'

export async function POST(request: NextRequest) {
  try {
    const { userId, isConfirmed = true } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // Confirm caller is an authenticated admin
    const requesterClient = await createServerClient()
    const { data: { user: requester } } = await requesterClient.auth.getUser()
    if (!requester) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }

    const { data: requesterProfile } = await requesterClient
      .from('profiles')
      .select('role')
      .eq('id', requester.id)
      .single()

    if (!requesterProfile || !hasExactRole(requesterProfile.role, 'admin')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ดำเนินการนี้' }, { status: 403 })
    }

    const admin = createAdminClient()

    // 1. Update auth.users email_confirm in Supabase Auth
    if (isConfirmed) {
      const { error: authError } = await admin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      })
      if (authError) {
        console.error('Error confirming user in auth.users:', authError)
      }
    }

    // 2. Update profiles is_confirmed field in DB
    const { error: profileError } = await admin
      .from('profiles')
      .update({ is_confirmed: isConfirmed, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profiles table:', profileError)
      return NextResponse.json({ error: profileError.message || 'ไม่สามารถอัปเดตสถานะผู้ใช้งานได้' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      userId,
      isConfirmed,
      message: isConfirmed ? 'ยืนยันสิทธิ์การใช้งานบัญชีผู้ใช้เรียบร้อยแล้ว' : 'ยกเลิกการยืนยันบัญชีเรียบร้อยแล้ว',
    })
  } catch (err: any) {
    console.error('Error in /api/admin/users/confirm:', err)
    return NextResponse.json({ error: err?.message || 'เกิดข้อผิดพลาดในการยืนยันสิทธิ์ผู้ใช้งาน' }, { status: 500 })
  }
}
