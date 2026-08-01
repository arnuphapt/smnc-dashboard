'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/services/supabase'
import { Shield, Lock, Check, X, GraduationCap, UserCheck, Edit2 } from 'lucide-react'
import { MasterDataTable } from '@/components/MasterDataTable'
import { DataTableColumn } from '@/components/DataTable'

interface RolePermission {
  id: string
  role: string
  page_key: string
  can_view: boolean
}

interface RoleRow {
  key: string
  label: string
  desc: string
  icon: React.ReactNode
  colorClass: string
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

const ROLES: RoleRow[] = [
  {
    key: 'teacher',
    label: 'อาจารย์ (Teacher)',
    desc: 'คณาจารย์และบุคลากรทั่วไปที่ใช้งานระบบยื่นคำขอและสืบค้นข้อมูล',
    icon: <GraduationCap className="w-4 h-4" />,
    colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
    isLocked: false,
  },
  {
    key: 'expert',
    label: 'ผู้ทรงคุณวุฒิ (Expert)',
    desc: 'ผู้ทรงคุณวุฒิที่ได้รับมอบหมายเพื่อพิจารณาจริยธรรมการวิจัยของโครงการวิจัย',
    icon: <UserCheck className="w-4 h-4" />,
    colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
    isLocked: false,
  },
  {
    key: 'assistant_admin',
    label: 'ผู้ช่วยแอดมิน (Assistant Admin)',
    desc: 'ผู้ช่วยดูแลระบบ เข้าถึงและจัดการระบบได้ตามสิทธิ์ที่ได้รับมอบหมาย',
    icon: <Shield className="w-4 h-4 text-orange-600" />,
    colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
    isLocked: false,
  },
  {
    key: 'admin',
    label: 'ผู้ดูแลระบบ (Admin)',
    desc: 'ผู้ดูแลระบบที่มีสิทธิ์สูงสุด สิทธิ์การเข้าถึงทุกหน้าถูกล็อกถาวร',
    icon: <Shield className="w-4 h-4" />,
    colorClass: 'bg-red-50 text-red-700 border-red-200',
    isLocked: true,
  },
]

export const RolesTab: React.FC = () => {
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null)

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

  const filteredRoles = ROLES.filter(
    (r) =>
      !search.trim() ||
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.desc.toLowerCase().includes(search.toLowerCase())
  )

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
        searchPlaceholder="ค้นหาระดับสิทธิ์..."
        searchValue={search}
        onSearchChange={setSearch}
        columns={columns}
        data={filteredRoles}
        getRowKey={(r) => r.key}
        loading={loading}
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
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${editingRole.colorClass}`}>
                  {editingRole.icon}
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
    </div>
  )
}
