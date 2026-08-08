import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 10; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'กรุณาระบุ User ID' }, { status: 400 })
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

    if (!requesterProfile || !String(requesterProfile.role).includes('admin')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ดำเนินการนี้' }, { status: 403 })
    }

    const admin = createAdminClient()

    // 1. Get user profile
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้นี้ในระบบ' }, { status: 404 })
    }

    const newPassword = generateTempPassword()

    // 2. Update auth user password
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้' }, { status: 500 })
    }

    const origin = request.headers.get('origin') || (request.headers.get('host') ? `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}` : '')
    const baseUrl = (origin && !origin.includes('localhost')) ? origin : (process.env.NEXT_PUBLIC_SITE_URL || origin || '')
    const redirectPath = profile.temp_target_submission_id
      ? `/ethics/submissions?highlight=${profile.temp_target_submission_id}`
      : `/ethics/submissions`
    const loginUrl = `${baseUrl}/login?redirect=${encodeURIComponent(redirectPath)}`

    return NextResponse.json({
      email: profile.email,
      password: newPassword,
      loginUrl,
      expiresAt: profile.temp_expires_at,
    })
  } catch (err: any) {
    const errMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))
    return NextResponse.json({ error: errMsg || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' }, { status: 500 })
  }
}
