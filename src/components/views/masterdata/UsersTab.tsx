import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Users, GraduationCap, UserCheck, Shield, Edit2, Plus, X, Key, Clock, Copy, Sparkles, CheckCircle2, BookOpen } from 'lucide-react'
import { DataTableColumn } from '@/components/DataTable'
import { MasterDataTable } from '@/components/MasterDataTable'
import { Profile } from '@/context/AuthContext'
import { getUserRoles, ROLE_OPTIONS } from '@/utils/roleHelper'
import { parseAuthors } from '@/utils/authorHelper'
import { WisdomItem } from '../Dashboard'

interface UsersTabProps {
  profiles: Profile[]
  usersLoading: boolean
  items?: WisdomItem[]
  onUpdateRole: (userId: string, newRole: string, fullName?: string) => void
  onAddUser: (email: string, password: string, role: string) => Promise<void>
}

export const UsersTab: React.FC<UsersTabProps> = ({ profiles, usersLoading, items = [], onUpdateRole, onAddUser }) => {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [newRole, setNewRole] = useState<string>('')
  const [newFullName, setNewFullName] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  // Add User modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addRole, setAddRole] = useState('teacher')
  const [isTempAccount, setIsTempAccount] = useState(false)
  const [tempHours, setTempHours] = useState('72')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

  const [tempCredentialResult, setTempCredentialResult] = useState<{
    email: string
    password: string
    loginUrl: string
    expiresAt: string
  } | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleViewOrResetTempUser = async (profile: Profile) => {
    setResettingPassword(true)
    try {
      const res = await fetch('/api/admin/reset-temp-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = typeof data.error === 'string' ? data.error : (data.error?.message || JSON.stringify(data.error))
        throw new Error(msg || 'เกิดข้อผิดพลาดในการดึงข้อมูลบัญชีชั่วคราว')
      }
      setTempCredentialResult(data)
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถดึงข้อมูลบัญชีชั่วคราวได้')
    } finally {
      setResettingPassword(false)
    }
  }

  // Calculate user contributions across all items
  const getUserContributions = (userProfile: Profile) => {
    const userEmail = (userProfile.email || '').toLowerCase().trim()
    const userName = (userProfile.full_name || '').toLowerCase().trim()

    const counts: Record<string, number> = {}
    let totalItems = 0

    items.forEach((item) => {
      const authors = parseAuthors(item.authors)
      const matched = authors.find((a) => {
        const nameLower = a.name.toLowerCase().trim()
        return (userEmail && nameLower === userEmail) || (userName && nameLower === userName)
      })

      if (matched) {
        totalItems++
        const roles = matched.contribution ? matched.contribution.split(',').map((s) => s.trim()) : ['Co author']
        roles.forEach((r) => {
          counts[r] = (counts[r] || 0) + 1
        })
      }
    })

    return { counts, totalItems }
  }

  const columns: DataTableColumn<Profile>[] = [
    {
      key: 'email',
      header: 'ชื่อ-นามสกุล / อีเมล',
      render: (p) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0F172A]">{p.full_name || p.email}</span>
            {p.is_temp_account && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                ⏳ ชั่วคราว (Temp)
              </span>
            )}
          </div>
          {p.full_name && (
            <span className="text-[11px] text-slate-400 font-mono font-medium">{p.email}</span>
          )}
        </div>
      )
    },
    {
      key: 'full_name',
      header: 'ชื่อ-นามสกุล',
      render: (p) => (
        <span className="font-bold text-slate-800 text-xs">
          {p.full_name || <span className="text-slate-400 font-normal italic">—</span>}
        </span>
      ),
    },
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
      key: 'contributions',
      header: 'การมีส่วนร่วมในผลงาน (Authors)',
      render: (p) => {
        const { counts, totalItems } = getUserContributions(p)
        if (totalItems === 0) {
          return <span className="text-slate-400 text-xs font-normal italic">ยังไม่มีผลงาน</span>
        }

        return (
          <div className="flex flex-wrap gap-1 items-center">
            {Object.entries(counts).map(([roleName, count]) => (
              <span
                key={roleName}
                className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#0EA5A0]/10 text-[#0EA5A0] border border-[#0EA5A0]/20 flex items-center gap-1"
              >
                <span>{roleName}</span>
                <span className="bg-[#0EA5A0] text-white px-1.5 py-0.2 rounded-full text-[9px]">{count}</span>
              </span>
            ))}
          </div>
        )
      },
    },
    {
      key: 'created_at',
      header: 'วันที่ลงทะเบียน',
      render: (p) => (
        <div className="text-slate-500 font-medium text-xs">
          <div>{new Date(p.created_at).toLocaleDateString('th-TH')}</div>
          {p.temp_expires_at && (
            <div className="text-[10px] text-amber-700 font-mono mt-0.5">
              หมดอายุ: {new Date(p.temp_expires_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          {p.is_temp_account && (
            <button
              onClick={() => handleViewOrResetTempUser(p)}
              disabled={resettingPassword}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold border transition-all duration-200 hover:-translate-y-0.5 shadow-xs cursor-pointer bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 disabled:opacity-50"
            >
              <Key className="w-3.5 h-3.5 text-amber-700" />
              <span>ข้อมูลเข้าสู่ระบบ</span>
            </button>
          )}
          <button
            onClick={() => {
              setSelectedProfile(p)
              setNewRole(p.role)
              setNewFullName(p.full_name || '')
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 hover:-translate-y-0.5 shadow-xs cursor-pointer bg-[#F0F7FF] text-[#0EA5A0] border-[#DAEEFF]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            แก้ไขสิทธิ์/ชื่อ
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

    setAddLoading(true)
    try {
      if (isTempAccount) {
        // Create Temp Expert Account via API
        const res = await fetch('/api/admin/create-temp-expert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, expiresInHours: Number(tempHours) }),
        })
        const data = await res.json()
        if (!res.ok) {
          const errorMsg = typeof data.error === 'string' ? data.error : (data.error?.message || JSON.stringify(data.error))
          throw new Error(errorMsg || 'เกิดข้อผิดพลาดในการสร้างบัญชีชั่วคราว')
        }
        setTempCredentialResult(data)
        setIsAddModalOpen(false)
        setAddEmail('')
        setAddPassword('')
        setIsTempAccount(false)
        window.location.reload()
      } else {
        // Standard user creation
        if (!addPassword || addPassword.length < 6) {
          setAddError('กรุณากรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร')
          setAddLoading(false)
          return
        }
        await onAddUser(trimmedEmail, addPassword, addRole)
        setIsAddModalOpen(false)
        setAddEmail('')
        setAddPassword('')
        setAddRole('teacher')
        setIsTempAccount(false)
      }
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
            setIsTempAccount(false)
            setTempHours('72')
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
              { value: 'assistant_admin', label: 'ผู้ช่วยแอดมิน (Assistant Admin)' },
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

              {/* Temp Account Option Toggle Box */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <div>
                      <div className="text-xs font-bold text-amber-950">สร้างเป็นบัญชีผู้ทรงคุณวุฒิชั่วคราว (Temp Account)</div>
                      <div className="text-[10px] text-amber-800 font-medium">กำหนดวันหมดอายุสำหรับผู้ประเมินภายนอก</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTempAccount}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setIsTempAccount(checked)
                      if (checked) {
                        const current = getUserRoles(addRole)
                        if (!current.includes('expert')) {
                          setAddRole([...current, 'expert'].join(','))
                        }
                      }
                    }}
                    className="w-4 h-4 accent-[#00796B] rounded cursor-pointer shrink-0"
                  />
                </label>

                {isTempAccount && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-1.5 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-amber-900">
                      ระยะเวลาที่สามารถใช้งานได้ (อายุบัญชี) *
                    </label>
                    <select
                      value={tempHours}
                      onChange={(e) => setTempHours(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-amber-200 bg-white text-amber-950 font-medium"
                    >
                      <option value="24">24 ชั่วโมง (1 วัน)</option>
                      <option value="48">48 ชั่วโมง (2 วัน)</option>
                      <option value="72">72 ชั่วโมง (3 วัน - ค่าเริ่มต้น)</option>
                      <option value="168">168 ชั่วโมง (7 วัน)</option>
                    </select>
                  </div>
                )}
              </div>

              {!isTempAccount && (
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
              )}

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

      {/* Modal for editing role and profile */}
      {selectedProfile && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800">จัดการข้อมูลและสิทธิ์ผู้ใช้งาน</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                อีเมล: <span className="font-bold text-slate-700">{selectedProfile.email}</span>
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5A0] mb-1">
                ชื่อ-นามสกุล (Full Name)
              </label>
              <input
                type="text"
                placeholder="ระบุชื่อ-นามสกุล..."
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/20 focus:border-[#0EA5A0]"
              />
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
                  onUpdateRole(selectedProfile.id, newRole, newFullName)
                  setSelectedProfile(null)
                }}
                className="btn-primary text-xs !py-2 !px-4 h-auto cursor-pointer"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal for showing Temp Expert Credentials Result */}
      {tempCredentialResult && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg font-bold shrink-0">
                🔑
              </div>
              <div>
                <h3 className="text-base font-black text-[#0F172A]">สร้างบัญชีผู้ทรงคุณวุฒิชั่วคราวสำเร็จ</h3>
                <p className="text-xs text-slate-500">สามารถส่งข้อมูลนี้ให้ผู้ทรงคุณวุฒิเพื่อเข้าประเมินงานได้ทันที</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#334155] bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-sans font-bold">อีเมล:</span>
                  <span className="font-bold text-[#0F172A]">{tempCredentialResult.email}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-sans font-bold">รหัสผ่านชั่วคราว:</span>
                  <span className="font-bold text-[#00796B] text-sm">{tempCredentialResult.password}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                  <span className="text-slate-500 font-sans font-bold">ลิงก์เข้าสู่ระบบตรง:</span>
                  <a
                    href={tempCredentialResult.loginUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0EA5A0] font-bold underline break-all"
                  >
                    {tempCredentialResult.loginUrl}
                  </a>
                </div>
              </div>

              <div className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                ⏳ หมดอายุในวันที่: <strong>{new Date(tempCredentialResult.expiresAt).toLocaleString('th-TH')}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const textToCopy = `เรียน ผู้ทรงคุณวุฒิ\n\nข้อมูลบัญชีผู้ใช้ชั่วคราวสำหรับเข้าสู่ระบบคลังปัญญาดิจิทัล:\nอีเมล: ${tempCredentialResult.email}\nรหัสผ่านชั่วคราว: ${tempCredentialResult.password}\nลิงก์เข้าสู่ระบบ: ${tempCredentialResult.loginUrl}\n(หมดอายุวันที่: ${new Date(tempCredentialResult.expiresAt).toLocaleString('th-TH')})`
                  navigator.clipboard.writeText(textToCopy)
                  setCopySuccess(true)
                  setTimeout(() => setCopySuccess(false), 3000)
                }}
                className="btn-primary rounded-full text-xs font-bold px-4 py-2 flex items-center gap-1.5 cursor-pointer"
              >
                {copySuccess ? <CheckCircle2 className="w-4 h-4 text-teal-200" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccess ? 'คัดลอกเรียบร้อย!' : 'คัดลอกข้อมูลทั้งหมด'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTempCredentialResult(null)}
                className="px-5 py-2 border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
