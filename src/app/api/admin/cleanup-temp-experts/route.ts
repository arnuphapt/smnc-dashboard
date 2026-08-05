import { NextResponse } from 'next/server'
import { cleanupExpiredTempAccounts } from '@/lib/tempAccountCleanup'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    // Confirm requester is authenticated admin
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

    if (!requesterProfile || !String(requesterProfile.role).includes('admin')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ดำเนินการนี้' }, { status: 403 })
    }

    const result = await cleanupExpiredTempAccounts()
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error('Error in cleanup-temp-experts route:', err)
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการลบบัญชีชั่วคราวที่หมดอายุ' }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
