import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Users, GraduationCap, UserCheck, Shield, Settings } from 'lucide-react'
import { DataTable, DataTableColumn } from '../../components/DataTable'
import { Profile } from '../../context/AuthContext'

interface UsersTabProps {
  profiles: Profile[]
  usersLoading: boolean
  onUpdateRole: (userId: string, newRole: string) => void
}

export const UsersTab: React.FC<UsersTabProps> = ({ profiles, usersLoading, onUpdateRole }) => {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [newRole, setNewRole] = useState<string>('')

  const columns: DataTableColumn<Profile>[] = [
    { key: 'email', header: 'อีเมลผู้ใช้งาน', render: (p) => <span className="font-bold" style={{ color: '#0B1D3A' }}>{p.email}</span> },
    {
      key: 'role',
      header: 'ระดับสิทธิ์',
      render: (p) => (
        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
          p.role === 'admin'
            ? 'bg-red-50 text-red-700 border border-red-200/60'
            : p.role === 'expert'
            ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
            : 'bg-teal-50 text-teal-700 border border-teal-200/60'
        }`}>
          {p.role.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'วันที่ลงทะเบียน',
      render: (p) => <span className="text-slate-500 font-medium">{new Date(p.created_at).toLocaleDateString('th-TH')}</span>,
    },
    {
      key: 'actions',
      header: 'จัดการสิทธิ์',
      align: 'center',
      render: (p) => (
        <button
          onClick={() => {
            setSelectedProfile(p)
            setNewRole(p.role)
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
          style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
        >
          <Settings className="w-3.5 h-3.5" />
          จัดการสิทธิ์
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>คน</p>
        <h3 className="text-base font-black" style={{ color: '#0B1D3A' }}>รายชื่อผู้ใช้และสิทธิ์การเข้าใช้งาน</h3>
      </div>

      <DataTable
        columns={columns}
        data={profiles}
        getRowKey={(p) => p.id}
        loading={usersLoading}
        loadingLabel="กำลังโหลดข้อมูลผู้ใช้..."
        empty={{ icon: <Users className="w-9 h-9 stroke-[1.5]" />, title: 'ยังไม่มีผู้ใช้งานในระบบ' }}
      />

      {/* Modal for editing role */}
      {selectedProfile && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800">จัดการสิทธิ์ผู้ใช้งาน</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                อีเมล: <span className="font-bold text-slate-700">{selectedProfile.email}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0]">
                สิทธิ์การใช้งาน
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'teacher', label: 'อาจารย์ (Teacher)', icon: <GraduationCap className="w-4 h-4" />, colorClass: 'text-[#0EA5A0]' },
                  { value: 'expert', label: 'ผู้ทรงคุณวุฒิ (Expert)', icon: <UserCheck className="w-4 h-4" />, colorClass: 'text-purple-700' },
                  { value: 'admin', label: 'ผู้ดูแลระบบ (Admin)', icon: <Shield className="w-4 h-4" />, colorClass: 'text-red-700' },
                ].map((roleOpt) => {
                  const isSelected = newRole === roleOpt.value
                  return (
                    <button
                      key={roleOpt.value}
                      type="button"
                      onClick={() => setNewRole(roleOpt.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold text-left transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-[#0EA5A0] bg-[#0EA5A0]/10 text-[#0EA5A0]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={roleOpt.colorClass}>{roleOpt.icon}</span>
                      <span>{roleOpt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateRole(selectedProfile.id, newRole)
                  setSelectedProfile(null)
                }}
                className="btn-primary text-xs !py-2 !px-4 h-auto cursor-pointer"
              >
                บันทึกสิทธิ์
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
