'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/services/supabase'
import { Shield, Lock, Check, X, GraduationCap, UserCheck, Edit2, Plus, User as UserIcon, Users, BookOpen, FlaskConical } from 'lucide-react'
import { MasterDataTable } from '@/components/MasterDataTable'
import { DataTableColumn } from '@/components/DataTable'
import { ICON_KEYS, COLOR_KEYS, COLOR_MAP } from '@/utils/roleHelper'

interface RolePermission {
  id: string
  role: string
  page_key: string
  can_view: boolean
}

interface RoleRow {
  key: string
  label: string
  short_label: string
  desc: string
  icon_name: string
  color_key: string
  isLocked: boolean
}

interface PageItem {
  key: string
  label: string
  isSub?: boolean
}

const pages: PageItem[] = [
  { key: 'dashboard', label: 'สรุปภาพรวม (Dashboard)' },

  { key: 'repositories', label: 'คลังผลงานปัญญา 5 ด้าน' },
  { key: 'repositories_research', label: '↳ คลังผลงานวิจัย', isSub: true },
  { key: 'repositories_innovation', label: '↳ คลังนวัตกรรม', isSub: true },
  { key: 'repositories_intellectual_property', label: '↳ คลังทรัพย์สินทางปัญญา', isSub: true },
  { key: 'repositories_award', label: '↳ คลังรางวัลและความสำเร็จ', isSub: true },
  { key: 'repositories_utilization', label: '↳ การนำไปใช้ประโยชน์', isSub: true },

  { key: 'clinic', label: 'บริการคลินิกวิจัย' },
  { key: 'clinic_request', label: '↳ ขอรับคำปรึกษา', isSub: true },
  { key: 'clinic_appointments', label: '↳ รวมคำขอจองนัดหมาย', isSub: true },

  { key: 'ethics', label: 'บริการจริยธรรมการวิจัย' },
  { key: 'ethics_submit', label: '↳ ยื่นโครงร่างวิจัย (IRB)', isSub: true },
  { key: 'ethics_submissions', label: '↳ รวมคำขอยื่นจริยธรรม', isSub: true },

  { key: 'ip_application', label: 'บริการทรัพย์สินทางปัญญา' },
  { key: 'ip_application_submit', label: '↳ ยื่นขอขึ้นทะเบียน IP', isSub: true },
  { key: 'ip_application_list', label: '↳ รวมคำขอยื่น IP', isSub: true },

  { key: 'masterdata', label: 'ระบบหลังบ้าน (Masterdata)' },
]

// Lookup from icon_name (fixed palette, see roleHelper.ts ICON_KEYS) to the
// actual lucide component. Lives here (UI layer) to keep roleHelper.ts free
// of JSX, mirroring the same pattern used in UsersTab.tsx.
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  GraduationCap,
  UserCheck,
  Lock,
  User: UserIcon,
  Users,
  BookOpen,
  FlaskConical,
}
const getIcon = (iconName: string) => ICON_MAP[iconName] || Shield

const SLUG_REGEX = /^[a-z][a-z0-9_]*$/

export const RolesTab: React.FC = () => {
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null)

  // Create-role modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newShortLabel, setNewShortLabel] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newIconName, setNewIconName] = useState<string>(ICON_KEYS[0])
  const [newColorKey, setNewColorKey] = useState<string>(COLOR_KEYS[0])
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const fetchRoles = async () => {
    setRolesLoading(true)
    try {
      const { data, error } = await supabase.from('roles').select('*').order('sort_order')
      if (error) throw error
      setRoles(
        (data || []).map((r: any) => ({
          key: r.key,
          label: r.label,
          short_label: r.short_label,
          desc: r.description,
          icon_name: r.icon_name,
          color_key: r.color_key,
          isLocked: r.is_locked,
        }))
      )
    } catch (err) {
      console.error('Error fetching roles:', err)
    } finally {
      setRolesLoading(false)
    }
  }

  const fetchPermissions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('role_permissions').select('*')
      if (error) throw error
      setPermissions(data || [])
    } catch (err) {
      console.error('Error fetching permissions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const handleToggle = async (role: string, pageKey: string, currentVal: boolean) => {
    if (role === 'admin') return
    const newVal = !currentVal
    setPermissions((prev) => {
      const exists = prev.some((p) => p.role === role && p.page_key === pageKey)
      if (exists) {
        return prev.map((p) => (p.role === role && p.page_key === pageKey ? { ...p, can_view: newVal } : p))
      }
      return [...prev, { id: `${role}-${pageKey}`, role, page_key: pageKey, can_view: newVal }]
    })
    try {
      const { error } = await supabase
        .from('role_permissions')
        .upsert({ role, page_key: pageKey, can_view: newVal }, { onConflict: 'role,page_key' })
      if (error) throw error
    } catch (err: any) {
      console.error('Error updating permission:', err?.message || err)
      fetchPermissions()
    }
  }

  const isAllowed = (role: string, pageKey: string) => {
    const perm = permissions.find((p) => p.role === role && p.page_key === pageKey)
    return perm ? perm.can_view : true
  }

  const filteredRoles = roles.filter(
    (r) =>
      !search.trim() ||
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.desc.toLowerCase().includes(search.toLowerCase())
  )

  const resetCreateForm = () => {
    setNewKey('')
    setNewLabel('')
    setNewShortLabel('')
    setNewDesc('')
    setNewIconName(ICON_KEYS[0])
    setNewColorKey(COLOR_KEYS[0])
    setCreateError('')
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')

    const trimmedKey = newKey.trim().toLowerCase()
    const trimmedLabel = newLabel.trim()
    const trimmedShortLabel = newShortLabel.trim()

    if (!trimmedKey || !SLUG_REGEX.test(trimmedKey)) {
      setCreateError('รหัสสิทธิ์ต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข หรือ _ เท่านั้น และต้องขึ้นต้นด้วยตัวอักษร')
      return
    }
    if (!trimmedLabel) {
      setCreateError('กรุณาระบุชื่อสิทธิ์ (label)')
      return
    }
    if (!trimmedShortLabel) {
      setCreateError('กรุณาระบุชื่อย่อสิทธิ์ (short label)')
      return
    }
    if (roles.some((r) => r.key === trimmedKey)) {
      setCreateError('ระดับสิทธิ์นี้มีอยู่แล้ว')
      return
    }

    setCreateLoading(true)
    try {
      const nextSortOrder = roles.length > 0 ? Math.max(...roles.map((_, i) => i)) + 2 : 1

      const { error: roleError } = await supabase.from('roles').insert({
        key: trimmedKey,
        label: trimmedLabel,
        short_label: trimmedShortLabel,
        description: newDesc.trim(),
        icon_name: newIconName,
        color_key: newColorKey,
        is_locked: false,
        sort_order: nextSortOrder,
      })

      if (roleError) {
        // Postgres PK violation -> friendly duplicate message instead of raw error dump
        if ((roleError as any).code === '23505') {
          setCreateError('ระดับสิทธิ์นี้มีอยู่แล้ว')
        } else {
          setCreateError(roleError.message || 'เกิดข้อผิดพลาดในการสร้างระดับสิทธิ์')
        }
        setCreateLoading(false)
        return
      }

      // Security-critical: auto-seed one deny-all (can_view: false) row per
      // existing page_key for the new role in the SAME submit flow. Given the
      // any-role-allows semantics in isPageAllowedForUser (absence of a
      // record = allowed), a role with zero permission rows would grant full
      // access by omission the moment it's assigned to a user. Deny-all here
      // makes the unsafe state require an explicit, auditable admin opt-in
      // per page instead of being the silent default. See plan section 2d.
      const denyAllRows = pages.map((p) => ({ role: trimmedKey, page_key: p.key, can_view: false }))
      const { error: permError } = await supabase.from('role_permissions').insert(denyAllRows)

      if (permError) {
        // Role now exists with no permission rows — surface this clearly so
        // the admin knows to open "จัดการสิทธิ์เข้าถึง" and the seeding will
        // self-heal there (handleToggle upserts missing rows on demand).
        setCreateError(
          `สร้างระดับสิทธิ์ "${trimmedLabel}" สำเร็จ แต่การตั้งค่าสิทธิ์เริ่มต้น (ปิดทุกหน้า) ล้มเหลว: ${permError.message}. กรุณาเปิด "แก้ไขสิทธิ์" เพื่อตรวจสอบสิทธิ์ของระดับนี้ด้วยตนเอง`
        )
        setCreateLoading(false)
        await fetchRoles()
        await fetchPermissions()
        return
      }

      setIsCreateModalOpen(false)
      resetCreateForm()
      await fetchRoles()
      await fetchPermissions()
    } catch (err: any) {
      setCreateError(err?.message || 'เกิดข้อผิดพลาดในการสร้างระดับสิทธิ์')
    } finally {
      setCreateLoading(false)
    }
  }

  const columns: DataTableColumn<RoleRow>[] = [
    {
      key: 'label',
      header: 'ระดับสิทธิ์',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 text-xs">{row.label}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed max-w-sm">{row.desc}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          {row.isLocked ? (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
              title="สิทธิ์ Admin ถูกล็อกถาวร"
            >
              <Lock className="w-3.5 h-3.5" />
              ล็อกถาวร
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingRole(row)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
              style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              แก้ไขสิทธิ์
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <MasterDataTable
        badge="ระดับสิทธิ์"
        title="ระดับสิทธิ์การใช้งานและการเข้าถึง"
        actionButton={{
          label: 'เพิ่มสิทธิ์ใหม่',
          onClick: () => {
            resetCreateForm()
            setIsCreateModalOpen(true)
          },
          icon: <Plus className="w-4 h-4" />,
        }}
        searchPlaceholder="ค้นหาระดับสิทธิ์..."
        searchValue={search}
        onSearchChange={setSearch}
        columns={columns}
        data={filteredRoles}
        getRowKey={(r) => r.key}
        loading={loading || rolesLoading}
        loadingLabel="กำลังโหลดการตั้งค่าสิทธิ์..."
        empty={{
          icon: <Shield className="w-9 h-9 stroke-[1.5]" />,
          title: 'ไม่พบระดับสิทธิ์ที่ตรงกัน',
        }}
      />

      {/* Manage Modal */}
      {editingRole &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5 max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    COLOR_MAP[editingRole.color_key]?.bgClass || COLOR_MAP.slate.bgClass
                  }`}
                >
                  {React.createElement(getIcon(editingRole.icon_name), { className: 'w-4 h-4' })}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">จัดการสิทธิ์เข้าถึง</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{editingRole.label}</p>
                </div>
              </div>

              {/* Page toggles */}
              <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0]">
                  หน้าที่สามารถเข้าถึงได้
                </label>
                <div className="flex flex-col gap-2 overflow-y-auto pr-1.5 max-h-[55vh]">
                  {pages.map((page) => {
                    const active = isAllowed(editingRole.key, page.key)
                    return (
                      <button
                        key={page.key}
                        type="button"
                        onClick={() => handleToggle(editingRole.key, page.key, active)}
                        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs font-bold text-left transition-all duration-150 cursor-pointer w-full ${
                          page.isSub ? 'ml-4 w-[calc(100%-1rem)] bg-slate-50/70 text-[11px]' : ''
                        } ${
                          active
                            ? 'border-[#0EA5A0] bg-[#0EA5A0]/8 text-[#0EA5A0]'
                            : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <span className={active ? 'text-slate-700 font-extrabold' : 'text-slate-400'}>{page.label}</span>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-400'
                          }`}
                        >
                          {active ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition text-white"
                  style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Create Role Modal */}
      {isCreateModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800">เพิ่มระดับสิทธิ์ใหม่</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ระดับสิทธิ์ใหม่จะเริ่มต้นด้วยการปิดการเข้าถึงทุกหน้า ต้องเปิดสิทธิ์รายหน้าเองภายหลัง
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createError && (
                <div className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1">
                    รหัสสิทธิ์ (slug) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น lab_coordinator"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/20 focus:border-[#0EA5A0] font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">ตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข หรือ _ เท่านั้น ขึ้นต้นด้วยตัวอักษร</p>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1">
                    ชื่อเต็ม (label) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ผู้ประสานงานห้องปฏิบัติการ (Lab Coordinator)"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/20 focus:border-[#0EA5A0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1">
                    ชื่อย่อ (short label) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ผู้ประสานงาน"
                    value={newShortLabel}
                    onChange={(e) => setNewShortLabel(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/20 focus:border-[#0EA5A0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1">
                    คำอธิบาย
                  </label>
                  <textarea
                    placeholder="คำอธิบายสิทธิ์นี้ (แสดงในตารางระดับสิทธิ์)"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={2}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/20 focus:border-[#0EA5A0] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1.5">
                    ไอคอน
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {ICON_KEYS.map((iconKey) => {
                      const IconComp = getIcon(iconKey)
                      const selected = newIconName === iconKey
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setNewIconName(iconKey)}
                          className={`flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                            selected
                              ? 'border-[#0EA5A0] bg-[#0EA5A0]/10 text-[#0EA5A0]'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                          title={iconKey}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1.5">
                    สี
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_KEYS.map((colorKey) => {
                      const selected = newColorKey === colorKey
                      const colors = COLOR_MAP[colorKey]
                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setNewColorKey(colorKey)}
                          className={`h-8 rounded-xl border-2 transition-all cursor-pointer ${colors.bgClass} ${
                            selected ? 'ring-2 ring-offset-1 ring-[#0EA5A0] border-[#0EA5A0]' : 'border-transparent'
                          }`}
                          title={colorKey}
                        />
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="btn-primary text-xs !py-2 !px-4 h-auto cursor-pointer disabled:opacity-50"
                  >
                    {createLoading ? 'กำลังสร้าง...' : 'สร้างระดับสิทธิ์'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
