import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { cleanupExpiredTempAccounts } from '@/lib/tempAccountCleanup'

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
    const { email, submissionId, expiresInHours = 72 } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'กรุณาระบุอีเมลผู้ทรงคุณวุฒิ' }, { status: 400 })
    }

    const targetSubmissionId = submissionId && typeof submissionId === 'string' ? submissionId : null

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

    // Auto cleanup any old expired temporary accounts before creating new one
    await cleanupExpiredTempAccounts()

    const admin = createAdminClient()
    const password = generateTempPassword()
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()

    // 1. Create temporary user in auth.users
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { role: 'expert', created_by_admin: true }
    })

    if (createError || !createdUser?.user) {
      console.error('Create temp user error:', createError)
      const errMsg = createError?.message || (typeof createError === 'object' ? JSON.stringify(createError) : String(createError))
      return NextResponse.json({ error: errMsg || 'ไม่สามารถสร้างบัญชีชั่วคราวได้' }, { status: 400 })
    }

    // 2. Insert/Upsert matching profile record
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: createdUser.user.id,
        email: email.trim(),
        role: 'expert',
        is_temp_account: true,
        temp_expires_at: expiresAt,
        temp_target_submission_id: targetSubmissionId,
      })

    if (profileError) {
      console.error('Upsert temp profile error:', profileError)
      return NextResponse.json({ error: profileError.message || 'ไม่สามารถบันทึกโปรไฟล์ผู้ใช้ชั่วคราวได้' }, { status: 500 })
    }

    // 3. Assign reviewer in ethics_submissions IF targetSubmissionId is provided
    if (targetSubmissionId) {
      const { error: assignError } = await admin
        .from('ethics_submissions')
        .update({ assigned_reviewer_id: createdUser.user.id })
        .eq('id', targetSubmissionId)

      if (assignError) {
        console.error('Assign reviewer error:', assignError)
        return NextResponse.json({ error: assignError.message || 'ไม่สามารถมอบหมายงานวิจัยให้ผู้ทรงคุณวุฒิได้' }, { status: 500 })
      }
    }

    const origin = request.headers.get('origin') || (request.headers.get('host') ? `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}` : '')
    const baseUrl = (origin && !origin.includes('localhost')) ? origin : (process.env.NEXT_PUBLIC_SITE_URL || origin || '')
    const redirectPath = targetSubmissionId
      ? `/ethics/submissions?highlight=${targetSubmissionId}`
      : `/ethics/submissions`
    const loginUrl = `${baseUrl}/login?redirect=${encodeURIComponent(redirectPath)}`

    return NextResponse.json({
      email: email.trim(),
      password,
      loginUrl,
      expiresAt,
    })
  } catch (err: any) {
    console.error('Unhandled API error in create-temp-expert:', err)
    const errMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))
    return NextResponse.json({ error: errMsg || 'เกิดข้อผิดพลาดในการสร้างบัญชีชั่วคราว' }, { status: 500 })
  }
}
