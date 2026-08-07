'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/services/supabase'
import { Shield, Lock, Check, X, GraduationCap, UserCheck, Edit2, Plus, User as UserIcon, Users, BookOpen, FlaskConical, Trash2 } from 'lucide-react'
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
  parentKey?: string
}

const pages: PageItem[] = [
  { key: 'dashboard', label: 'สรุปภาพรวม (Dashboard)' },

  { key: 'repositories', label: 'คลังผลงานปัญญา 5 ด้าน' },
  { key: 'repositories_research', label: '↳ คลังผลงานวิจัย', isSub: true, parentKey: 'repositories' },
  { key: 'repositories_innovation', label: '↳ คลังนวัตกรรม', isSub: true, parentKey: 'repositories' },
  { key: 'repositories_intellectual_property', label: '↳ คลังทรัพย์สินทางปัญญา', isSub: true, parentKey: 'repositories' },
  { key: 'repositories_award', label: '↳ คลังรางวัลและความสำเร็จ', isSub: true, parentKey: 'repositories' },
  { key: 'repositories_utilization', label: '↳ การนำไปใช้ประโยชน์', isSub: true, parentKey: 'repositories' },

  { key: 'clinic', label: 'บริการคลินิกวิจัย' },
  { key: 'clinic_request', label: '↳ ขอรับคำปรึกษา', isSub: true, parentKey: 'clinic' },
  { key: 'clinic_appointments', label: '↳ รวมคำขอจองนัดหมาย', isSub: true, parentKey: 'clinic' },

  { key: 'ethics', label: 'บริการจริยธรรมการวิจัย' },
  { key: 'ethics_submit', label: '↳ ยื่นโครงร่างวิจัย (IRB)', isSub: true, parentKey: 'ethics' },
  { key: 'ethics_submissions', label: '↳ รวมคำขอยื่นจริยธรรม', isSub: true, parentKey: 'ethics' },

  { key: 'ip_application', label: 'บริการทรัพย์สินทางปัญญา' },
  { key: 'ip_application_submit', label: '↳ ยื่นขอขึ้นทะเบียน IP', isSub: true, parentKey: 'ip_application' },
  { key: 'ip_application_list', label: '↳ รวมคำขอยื่น IP', isSub: true, parentKey: 'ip_application' },

  { key: 'masterdata', label: 'ระบบหลังบ้าน (Masterdata)' },
]

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
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // Edit-role draft modal state
  const [editTab, setEditTab] = useState<'permissions' | 'details'>('permissions')
  const [editLabel, setEditLabel] = useState('')
  const [editShortLabel, setEditShortLabel] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [draftPermissions, setDraftPermissions] = useState<Record<string, boolean>>({})
  const [saveLoading, setSaveLoading] = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => {
    if (editingRole) {
      setEditLabel(editingRole.label)
      setEditShortLabel(editingRole.short_label)
      setEditDesc(editingRole.desc || '')
      setEditError('')
      setEditTab('permissions')

      // Populate draftPermissions for editingRole.key
      const initialDraft: Record<string, boolean> = {}
      pages.forEach((p) => {
        const permRow = permissions.find((pr) => pr.role === editingRole.key && pr.page_key === p.key)
        initialDraft[p.key] = permRow ? permRow.can_view : true
      })
      setDraftPermissions(initialDraft)
    }
  }, [editingRole, permissions])

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

  const isDraftAllowed = (pageKey: string) => {
    return draftPermissions[pageKey] !== false
  }

  const handleDraftToggle = (pageKey: string) => {
    if (!editingRole || editingRole.key === 'admin') return
    const currentVal = isDraftAllowed(pageKey)
    const newVal = !currentVal

    const childPages = pages.filter((p) => p.parentKey === pageKey)
    let keysToUpdate: string[] = []

    if (childPages.length > 0) {
      // Main menu toggled -> bulk toggle parent AND all sub-menu items together locally
      keysToUpdate = [pageKey, ...childPages.map((c) => c.key)]
    } else {
      keysToUpdate = [pageKey]
      const clickedPage = pages.find((p) => p.key === pageKey)
      if (clickedPage?.parentKey) {
        const parentKey = clickedPage.parentKey
        const siblings = pages.filter((p) => p.parentKey === parentKey)
        const allSiblingsEnabled = siblings.every((s) => (s.key === pageKey ? newVal : isDraftAllowed(s.key)))
        const allSiblingsDisabled = siblings.every((s) => (s.key === pageKey ? newVal : isDraftAllowed(s.key)) === false)

        if (allSiblingsEnabled && !isDraftAllowed(parentKey)) {
          keysToUpdate.push(parentKey)
        } else if (allSiblingsDisabled && isDraftAllowed(parentKey)) {
          keysToUpdate.push(parentKey)
        }
      }
    }

    setDraftPermissions((prev) => {
      const next = { ...prev }
      keysToUpdate.forEach((k) => {
        next[k] = newVal
      })
      return next
    })
  }

  const handleSaveEditRole = async () => {
    if (!editingRole) return
    if (!editLabel.trim()) {
      setEditError('กรุณาระบุชื่อสิทธิ์ (label)')
      return
    }
    if (!editShortLabel.trim()) {
      setEditError('กรุณาระบุชื่อย่อสิทธิ์ (short label)')
      return
    }

    setSaveLoading(true)
    setEditError('')
    try {
      // 1. Update role metadata
      const resRole = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editingRole.key,
          label: editLabel.trim(),
          short_label: editShortLabel.trim(),
          description: editDesc.trim(),
          icon_name: editingRole.icon_name || 'Shield',
          color_key: editingRole.color_key || 'slate',
        }),
      })

      const roleData = await resRole.json()
      if (!resRole.ok) throw new Error(roleData.error || 'เกิดข้อผิดพลาดในการแก้ไขระดับสิทธิ์')

      // 2. Save all draft permissions for editingRole.key
      const upsertRows = pages.map((p) => ({
        role: editingRole.key,
        page_key: p.key,
        can_view: draftPermissions[p.key] !== false,
      }))

      const { error: permError } = await supabase
        .from('role_permissions')
        .upsert(upsertRows, { onConflict: 'role,page_key' })

      if (permError) throw permError

      await fetchRoles()
      await fetchPermissions()
      setEditingRole(null)
    } catch (err: any) {
      setEditError(err?.message || 'ไม่สามารถบันทึกข้อมูลระดับสิทธิ์ได้')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDeleteRole = async (roleKey: string) => {
    if (['admin', 'teacher', 'expert', 'assistant_admin'].includes(roleKey)) {
      alert('ไม่สามารถลบระดับสิทธิ์เริ่มต้นของระบบได้')
      return
    }
    if (!confirm(`คุณต้องการลบระดับสิทธิ์ "${roleKey}" ใช่หรือไม่?`)) return
    try {
      const res = await fetch(`/api/admin/roles?key=${roleKey}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบระดับสิทธิ์')
      setEditingRole(null)
      await fetchRoles()
      await fetchPermissions()
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบระดับสิทธิ์ได้')
    }
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

      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: trimmedKey,
          label: trimmedLabel,
          short_label: trimmedShortLabel,
          description: newDesc.trim(),
          icon_name: 'Shield',
          color_key: 'teal',
          sort_order: nextSortOrder,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setCreateError(data.error || 'เกิดข้อผิดพลาดในการสร้างระดับสิทธิ์')
        setCreateLoading(false)
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
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      COLOR_MAP[editingRole.color_key]?.bgClass || COLOR_MAP.slate.bgClass
                    }`}
                  >
                    {React.createElement(getIcon(editingRole.icon_name), { className: 'w-4 h-4' })}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">จัดการสิทธิ์เข้าถึง / แก้ไขระดับสิทธิ์</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{editingRole.label}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Tab Switcher */}
              <div className="flex border-b border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditTab('permissions')}
                  className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    editTab === 'permissions'
                      ? 'border-[#0EA5A0] text-[#0EA5A0]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  สิทธิ์การเข้าถึงหน้า
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('details')}
                  className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    editTab === 'details'
                      ? 'border-[#0EA5A0] text-[#0EA5A0]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  รายละเอียดระดับสิทธิ์
                </button>
              </div>

              {/* Scrollable Tab Content Area */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
                {editError && (
                  <div className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {editError}
                  </div>
                )}

                {/* Tab 1: Permissions */}
                {editTab === 'permissions' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0]">
                        หน้าที่สามารถเข้าถึงได้ (คลิกเมนูหลักเพื่อเปิด/ปิดพร้อมเมนูย่อย)
                      </label>
                    </div>
                    <div className="flex flex-col gap-2">
                      {pages.map((page) => {
                        const active = isDraftAllowed(page.key)
                        return (
                          <button
                            key={page.key}
                            type="button"
                            onClick={() => handleDraftToggle(page.key)}
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
                )}

                {/* Tab 2: Details */}
                {editTab === 'details' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1">
                        รหัสสิทธิ์ (slug)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={editingRole.key}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-mono cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1">
                        ชื่อเต็ม (label) *
                      </label>
                      <input
                        type="text"
                        required
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
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
                        value={editShortLabel}
                        onChange={(e) => setEditShortLabel(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/20 focus:border-[#0EA5A0]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1">
                        คำอธิบาย
                      </label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/20 focus:border-[#0EA5A0]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer with Unified Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
                <div>
                  {!['admin', 'teacher', 'expert', 'assistant_admin'].includes(editingRole.key) ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(editingRole.key)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      ลบสิทธิ์
                    </button>
                  ) : (
                    <div />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditRole}
                    disabled={saveLoading}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #0EA5A0 0%, #00796B 100%)' }}
                  >
                    {saveLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
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
                    rows={2}
                    placeholder="คำอธิบายสิทธิ์และการใช้งาน..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/20 focus:border-[#0EA5A0]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #0EA5A0 0%, #00796B 100%)' }}
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
