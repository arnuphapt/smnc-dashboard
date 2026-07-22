'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Users, GraduationCap, UserCheck, Shield, Edit2, Plus, X } from 'lucide-react'
import { DataTableColumn } from '@/components/DataTable'
import { MasterDataTable } from '@/components/MasterDataTable'
import { Profile } from '@/context/AuthContext'
import { getUserRoles, ROLE_OPTIONS } from '@/utils/roleHelper'

interface UsersTabProps {
  profiles: Profile[]
  usersLoading: boolean
  onUpdateRole: (userId: string, newRole: string) => void
  onAddUser: (email: string, password: string, role: string) => Promise<void>
}

export const UsersTab: React.FC<UsersTabProps> = ({ profiles, usersLoading, onUpdateRole, onAddUser }) => {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [newRole, setNewRole] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  // Add User modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addRole, setAddRole] = useState('teacher')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const columns: DataTableColumn<Profile>[] = [
    { key: 'email', header: 'อีเมลผู้ใช้งาน', render: (p) => <span className="font-bold" style={{ color: '#0B1D3A' }}>{p.email}</span> },
    {
      key: 'role',
      header: 'ระดับสิทธิ์การใช้งาน (Roles)',
      render: (p) => {
        const roles = getUserRoles(p.role)
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((r) => {
              const opt = ROLE_OPTIONS.find((o) => o.value === r)
              return (
                <span
                  key={r}
                  className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                    opt?.bgClass || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {opt?.shortLabel || r}
                </span>
              )
            })}
          </div>
        )
      },
    },
    {
      key: 'created_at',
      header: 'วันที่ลงทะเบียน',
      render: (p) => <span className="text-slate-500 font-medium">{new Date(p.created_at).toLocaleDateString('th-TH')}</span>,
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setSelectedProfile(p)
              setNewRole(p.role)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer"
            style={{ background: '#F0F7FF', color: '#0EA5A0', borderColor: '#DAEEFF' }}
          >
            <Edit2 className="w-3.5 h-3.5" />
            แก้ไขสิทธิ์
          </button>
        </div>
      ),
    },
  ]

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch = !searchQuery.trim() ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = !selectedRole || getUserRoles(p.role).includes(selectedRole)

    return matchesSearch && matchesRole
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')

    const trimmedEmail = addEmail.trim()
    if (!trimmedEmail) {
      setAddError('กรุณาระบุอีเมลผู้ใช้งาน')
      return
    }

    if (!addPassword || addPassword.length < 6) {
      setAddError('กรุณากรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร')
      return
    }

    setAddLoading(true)
    try {
      await onAddUser(trimmedEmail, addPassword, addRole)
      setIsAddModalOpen(false)
      setAddEmail('')
      setAddPassword('')
      setAddRole('teacher')
    } catch (err: any) {
      setAddError(err.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน')
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <MasterDataTable
        badge="คน"
        title="รายชื่อผู้ใช้และสิทธิ์การเข้าใช้งาน"
        actionButton={{
          label: 'เพิ่มผู้ใช้งานใหม่',
          onClick: () => {
            setAddEmail('')
            setAddPassword('')
            setAddRole('teacher')
            setAddError('')
            setIsAddModalOpen(true)
          },
          icon: <Plus className="w-4 h-4" />
        }}
        searchPlaceholder="ค้นหาผู้ใช้ (อีเมล/สิทธิ์)..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: 'role',
            label: 'ระดับสิทธิ์',
            value: selectedRole,
            onChange: setSelectedRole,
            options: [
              { value: 'admin', label: 'ผู้ดูแลระบบ (Admin)' },
              { value: 'expert', label: 'ผู้ทรงคุณวุฒิ (Expert)' },
              { value: 'teacher', label: 'อาจารย์ (Teacher)' }
            ]
          }
        ]}
        columns={columns}
        data={filteredProfiles}
        getRowKey={(p) => p.id}
        loading={usersLoading}
        loadingLabel="กำลังโหลดข้อมูลผู้ใช้..."
        empty={{
          icon: <Users className="w-9 h-9 stroke-[1.5]" />,
          title: 'ยังไม่มีผู้ใช้งานในระบบ',
          dashed: true
        }}
      />

      {/* Modal for adding user */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">เพิ่มผู้ใช้งานใหม่</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ระบุอีเมลและรหัสผ่านเพื่อสร้างบัญชีผู้ใช้ใหม่
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1">
                  อีเมลผู้ใช้งาน *
                </label>
                <input
                  type="email"
                  required
                  placeholder="username@smnc.ac.th"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/20 focus:border-[#0EA5A0]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1">
                  รหัสผ่านเริ่มต้น * (อย่างน้อย 6 ตัวอักษร)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/20 focus:border-[#0EA5A0]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0]">
                  ระดับสิทธิ์การใช้งาน
                </label>
                <div className="flex flex-col gap-1.5">
                  {ROLE_OPTIONS.map((roleOpt) => {
                    const currentRoles = getUserRoles(addRole)
                    const isChecked = currentRoles.includes(roleOpt.value)
                    const toggleRole = () => {
                      let updated: string[]
                      if (isChecked) {
                        if (currentRoles.length === 1) return
                        updated = currentRoles.filter((r) => r !== roleOpt.value)
                      } else {
                        updated = [...currentRoles, roleOpt.value]
                      }
                      setAddRole(updated.join(','))
                    }
                    const IconComponent = roleOpt.value === 'admin' ? Shield : roleOpt.value === 'expert' ? UserCheck : GraduationCap

                    return (
                      <button
                        key={roleOpt.value}
                        type="button"
                        onClick={toggleRole}
                        className={`flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs font-bold text-left transition-all duration-150 cursor-pointer ${
                          isChecked
                            ? 'border-[#0EA5A0] bg-[#0EA5A0]/10 text-[#0EA5A0]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={roleOpt.colorClass}><IconComponent className="w-4 h-4" /></span>
                          <span>{roleOpt.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 accent-[#0EA5A0] rounded cursor-pointer pointer-events-none"
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="btn-primary text-xs !py-2 !px-4 h-auto cursor-pointer disabled:opacity-50"
                >
                  {addLoading ? 'กำลังสร้างบัญชี...' : 'เพิ่มผู้ใช้งาน'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

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
                {ROLE_OPTIONS.map((roleOpt) => {
                  const currentRoles = getUserRoles(newRole)
                  const isChecked = currentRoles.includes(roleOpt.value)
                  const toggleRole = () => {
                    let updated: string[]
                    if (isChecked) {
                      if (currentRoles.length === 1) return // Keep at least one role
                      updated = currentRoles.filter((r) => r !== roleOpt.value)
                    } else {
                      updated = [...currentRoles, roleOpt.value]
                    }
                    setNewRole(updated.join(','))
                  }

                  const IconComponent = roleOpt.value === 'admin' ? Shield : roleOpt.value === 'expert' ? UserCheck : GraduationCap

                  return (
                    <button
                      key={roleOpt.value}
                      type="button"
                      onClick={toggleRole}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold text-left transition-all duration-150 cursor-pointer ${
                        isChecked
                          ? 'border-[#0EA5A0] bg-[#0EA5A0]/10 text-[#0EA5A0]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={roleOpt.colorClass}><IconComponent className="w-4 h-4" /></span>
                        <span>{roleOpt.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 accent-[#0EA5A0] rounded cursor-pointer pointer-events-none"
                      />
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
