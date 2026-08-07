import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

const pages = [
  'dashboard',
  'repositories',
  'repositories_research',
  'repositories_innovation',
  'repositories_intellectual_property',
  'repositories_award',
  'repositories_utilization',
  'clinic',
  'clinic_request',
  'clinic_appointments',
  'ethics',
  'ethics_submit',
  'ethics_submissions',
  'ip_application',
  'ip_application_submit',
  'ip_application_list',
  'masterdata',
]

export async function POST(request: Request) {
  try {
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

    const body = await request.json()
    const { key, label, short_label, description, icon_name, color_key, sort_order } = body

    if (!key || !label || !short_label) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Insert role record
    const { data: createdRole, error: roleError } = await admin
      .from('roles')
      .insert({
        key,
        label,
        short_label,
        description: description || '',
        icon_name: icon_name || 'Shield',
        color_key: color_key || 'slate',
        is_locked: false,
        sort_order: sort_order || 99,
      })
      .select()
      .single()

    if (roleError) {
      if ((roleError as any).code === '23505') {
        return NextResponse.json({ error: 'ระดับสิทธิ์นี้มีอยู่แล้ว' }, { status: 400 })
      }
      return NextResponse.json({ error: roleError.message || 'ไม่สามารถสร้างระดับสิทธิ์ได้' }, { status: 500 })
    }

    // 2. Auto-seed deny-all (can_view: false) rows for all pages for this new role
    const denyAllRows = pages.map((pageKey) => ({
      role: key,
      page_key: pageKey,
      can_view: false,
    }))

    const { error: permError } = await admin.from('role_permissions').upsert(denyAllRows, { onConflict: 'role,page_key' })

    if (permError) {
      console.error('Error auto-seeding role_permissions:', permError)
    }

    return NextResponse.json({ success: true, role: createdRole })
  } catch (err: any) {
    console.error('API Error in /api/admin/roles:', err)
    return NextResponse.json({ error: err?.message || 'เกิดข้อผิดพลาดในการสร้างระดับสิทธิ์' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
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

    const body = await request.json()
    const { key, label, short_label, description, icon_name, color_key } = body

    if (!key || !label || !short_label) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: updatedRole, error: updateErr } = await admin
      .from('roles')
      .update({
        label,
        short_label,
        description: description || '',
        icon_name: icon_name || 'Shield',
        color_key: color_key || 'slate',
      })
      .eq('key', key)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message || 'ไม่สามารถแก้ไขข้อมูลระดับสิทธิ์ได้' }, { status: 500 })
    }

    return NextResponse.json({ success: true, role: updatedRole })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลระดับสิทธิ์' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'กรุณาระบุ key ของระดับสิทธิ์ที่ต้องการลบ' }, { status: 400 })
    }

    if (['admin', 'teacher', 'expert', 'assistant_admin'].includes(key)) {
      return NextResponse.json({ error: 'ไม่สามารถลบระดับสิทธิ์เริ่มต้นของระบบได้' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Delete permissions first
    await admin.from('role_permissions').delete().eq('role', key)

    // Delete role record
    const { error: delError } = await admin.from('roles').delete().eq('key', key)
    if (delError) {
      return NextResponse.json({ error: delError.message || 'ไม่สามารถลบระดับสิทธิ์ได้' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'เกิดข้อผิดพลาดในการลบระดับสิทธิ์' }, { status: 500 })
  }
}
