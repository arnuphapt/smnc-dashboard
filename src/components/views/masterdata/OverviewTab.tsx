'use client'

import React from 'react'
import Link from 'next/link'
import { Calendar, Clipboard, Award, Inbox, ArrowRight } from 'lucide-react'

export interface DeskItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  kind: string
  title: string
  who: string
  createdAt: string
  to: string
}

interface OverviewTabProps {
  pendingAppointmentsCount: number
  pendingEthicsCount: number
  pendingIpCount: number
  deskItems: DeskItem[]
}

// "โต๊ะทำงานวันนี้" (Today's Desk) — the admin's inbox, built from whatever is
// actually pending across appointments/ethics/IP right now, not a static menu.
export const OverviewTab: React.FC<OverviewTabProps> = ({
  pendingAppointmentsCount,
  pendingEthicsCount,
  pendingIpCount,
  deskItems,
}) => (
  <div className="space-y-6">
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>ภาพรวม</p>
      <h2 className="text-base font-black" style={{ color: '#0B1D3A' }}>โต๊ะทำงานวันนี้</h2>
      <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
        รายการที่รอการดำเนินการจากคุณ เรียงจากรายการล่าสุด
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Link href="/master/clinic" className="p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
        <Calendar className="w-5 h-5 mb-3" style={{ color: '#0EA5A0' }} />
        <div className="text-2xl font-black font-mono" style={{ color: '#0B1D3A' }}>{pendingAppointmentsCount}</div>
        <div className="text-xs font-bold mt-0.5" style={{ color: '#475569' }}>นัดหมายรอยืนยัน</div>
      </Link>
      <Link href="/master/ethics" className="p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
        <Clipboard className="w-5 h-5 mb-3" style={{ color: '#0EA5A0' }} />
        <div className="text-2xl font-black font-mono" style={{ color: '#0B1D3A' }}>{pendingEthicsCount}</div>
        <div className="text-xs font-bold mt-0.5" style={{ color: '#475569' }}>จริยธรรมรอมอบหมาย</div>
      </Link>
      <Link href="/master/ip" className="p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
        <Award className="w-5 h-5 mb-3" style={{ color: '#0EA5A0' }} />
        <div className="text-2xl font-black font-mono" style={{ color: '#0B1D3A' }}>{pendingIpCount}</div>
        <div className="text-xs font-bold mt-0.5" style={{ color: '#475569' }}>คำขอ IP รอดำเนินการ</div>
      </Link>
    </div>

    <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E2EDF8' }}>
      {deskItems.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
          <Inbox className="w-10 h-10 stroke-[1.5]" style={{ color: '#CBD5E1' }} />
          <p className="text-sm font-bold" style={{ color: '#0B1D3A' }}>โต๊ะว่างแล้ว ไม่มีรายการค้างดำเนินการ</p>
          <p className="text-xs" style={{ color: '#94A3B8' }}>รายการใหม่จากอาจารย์จะปรากฏที่นี่ทันที</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
          {deskItems.map((it) => {
            const Icon = it.icon
            return (
              <Link key={it.id} href={it.to} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,160,0.1)', color: '#0EA5A0' }}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: '#0B1D3A' }}>{it.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#94A3B8' }}>{it.kind} · {it.who}</p>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#CBD5E1' }} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  </div>
)
