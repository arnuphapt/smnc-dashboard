import React from 'react'
import { Users } from 'lucide-react'
import { DataTable, DataTableColumn } from '../../components/DataTable'
import { Profile } from '../../context/AuthContext'

interface UsersTabProps {
  profiles: Profile[]
  usersLoading: boolean
  onUpdateRole: (userId: string, newRole: string) => void
}

export const UsersTab: React.FC<UsersTabProps> = ({ profiles, usersLoading, onUpdateRole }) => {
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
      header: 'แก้ไขบทบาทหน้าที่',
      align: 'center',
      render: (p) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => onUpdateRole(p.id, 'teacher')}
            disabled={p.role === 'teacher'}
            className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-700 text-teal-700 hover:text-white border border-teal-200/40 text-[9px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            TEACHER
          </button>
          <button
            onClick={() => onUpdateRole(p.id, 'expert')}
            disabled={p.role === 'expert'}
            className="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-700 text-purple-700 hover:text-white border border-purple-200/40 text-[9px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            EXPERT
          </button>
          <button
            onClick={() => onUpdateRole(p.id, 'admin')}
            disabled={p.role === 'admin'}
            className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-700 text-red-700 hover:text-white border border-red-200/40 text-[9px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            ADMIN
          </button>
        </div>
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
    </div>
  )
}
