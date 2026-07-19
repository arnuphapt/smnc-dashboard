import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../services/supabase'
import { Shield, Lock, Check, X, GraduationCap, UserCheck, Edit2 } from 'lucide-react'
import { MasterDataTable } from '../../components/MasterDataTable'
import { DataTableColumn } from '../../components/DataTable'

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

const pages = [
  { key: 'dashboard', label: 'สรุปภาพรวม (Dashboard)' },
  { key: 'repositories', label: 'คลังผลงานปัญญา 5 ด้าน' },
  { key: 'clinic', label: 'บริการคลินิกวิจัย' },
  { key: 'ethics', label: 'บริการจริยธรรมการวิจัย' },
  { key: 'ip_application', label: 'บริการทรัพย์สินทางปัญญา' },
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
    setPermissions((prev) =>
      prev.map((p) => (p.role === role && p.page_key === pageKey ? { ...p, can_view: newVal } : p))
    )
    try {
      const { error } = await supabase
        .from('role_permissions')
        .update({ can_view: newVal })
        .match({ role, page_key: pageKey })
      if (error) throw error
    } catch (err) {
      console.error('Error updating permission:', err)
      setPermissions((prev) =>
        prev.map((p) => (p.role === role && p.page_key === pageKey ? { ...p, can_view: currentVal } : p))
      )
    }
  }

  const isAllowed = (role: string, pageKey: string) => {
    const perm = permissions.find((p) => p.role === role && p.page_key === pageKey)
    return perm ? perm.can_view : false
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 flex flex-col gap-5">
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
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0]">
                  หน้าที่สามารถเข้าถึงได้
                </label>
                <div className="flex flex-col gap-2">
                  {pages.map((page) => {
                    const active = isAllowed(editingRole.key, page.key)
                    return (
                      <button
                        key={page.key}
                        type="button"
                        onClick={() => handleToggle(editingRole.key, page.key, active)}
                        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs font-bold text-left transition-all duration-150 cursor-pointer w-full ${
                          active
                            ? 'border-[#0EA5A0] bg-[#0EA5A0]/8 text-[#0EA5A0]'
                            : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <span className={active ? 'text-slate-700' : 'text-slate-400'}>{page.label}</span>
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
              <div className="flex justify-end">
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
