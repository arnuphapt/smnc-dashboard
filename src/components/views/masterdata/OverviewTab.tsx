'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Users,
  Database,
  BookOpen,
  Award,
  Lightbulb,
  Trophy,
  Share2,
  ClipboardCheck,
  FileCheck,
  Calendar,
  ArrowRight,
  ChevronRight,
  Clock
} from 'lucide-react'

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

export const OverviewTab: React.FC<OverviewTabProps> = ({
  pendingAppointmentsCount,
  pendingEthicsCount,
  pendingIpCount,
}) => {
  const sections = [
    {
      title: 'ตั้งค่าระบบและสิทธิ์การใช้งาน (System Settings)',
      subtitle: 'จัดการบทบาทผู้ใช้งาน สิทธิ์การเข้าถึงเมนู และข้อมูลตัวเลือกหลักของระบบ',
      items: [
        {
          title: 'สิทธิ์การใช้งานและบทบาท (Access Roles)',
          desc: 'กำหนดและจัดการบทบาทผู้ใช้งาน (Roles) พร้อมกำหนดสิทธิ์การเข้าถึงเมนูย่อยในระบบอย่างละเอียด',
          href: '/master/roles',
          icon: ShieldCheck,
          iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
          badge: 'System Settings',
          badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
        },
        {
          title: 'จัดการผู้ใช้งานระบบ (User Management)',
          desc: 'จัดการข้อมูลบัญชีผู้ใช้งาน ตรวจสอบสถานะการสมัคร และปรับเปลี่ยนสิทธิ์ประจำตัวผู้ใช้',
          href: '/master/users',
          icon: Users,
          iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
          badge: 'System Settings',
          badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        {
          title: 'ตารางข้อมูลพื้นฐาน (Master Lookups)',
          desc: 'จัดการข้อมูล Master Options เช่น ภาควิชา, ปี พ.ศ., ประเภทงานวิจัย, ฐานข้อมูลวารสาร',
          href: '/master/masters',
          icon: Database,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
      ]
    },
    {
      title: 'จัดการข้อมูลคลังปัญญาหลัก (General Master Data)',
      subtitle: 'จัดการคลังข้อมูลบทความวิจัย ทรัพย์สินทางปัญญา นวัตกรรม และผลงานใช้ประโยชน์ทั้งหมด',
      items: [
        {
          title: 'คลังผลงานวิจัย (Research Articles)',
          desc: 'เพิ่ม แก้ไข และลบข้อมูลผลงานวิจัย บทความวารสารวิชาการ และงานตีพิมพ์',
          href: '/master/items/research',
          icon: BookOpen,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          badge: 'Master Data',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
        },
        {
          title: 'ทรัพย์สินทางปัญญา (Intellectual Property)',
          desc: 'จัดการข้อมูลสิทธิบัตร อนุสิทธิบัตร ลิขสิทธิ์ และเครื่องหมายการค้าประจำสถาบัน',
          href: '/master/items/intellectual_property',
          icon: Award,
          iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
          badge: 'Master Data',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
        },
        {
          title: 'ผลงานนวัตกรรม (Innovations)',
          desc: 'จัดการฐานข้อมูลสิ่งประดิษฐ์ นวัตกรรมทางการพยาบาล และซอฟต์แวร์ต้นแบบ',
          href: '/master/items/innovation',
          icon: Lightbulb,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
          badge: 'Master Data',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
        },
        {
          title: 'รางวัลและความสำเร็จ (Awards & Honors)',
          desc: 'บันทึกและจัดการข้อมูลรางวัลเชิดชูเกียรติ ผลงานความสำเร็จระดับสถาบันและนานาชาติ',
          href: '/master/items/award',
          icon: Trophy,
          iconBg: 'bg-yellow-50 text-yellow-600 border-yellow-200',
          badge: 'Master Data',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
        },
        {
          title: 'การนำไปใช้ประโยชน์ (Research Utilization)',
          desc: 'จัดการข้อมูลผลงานวิจัยและนวัตกรรมที่ถูกนำไปใช้ประโยชน์เชิงพาณิชย์ ชุมชน หรือนโยบาย',
          href: '/master/items/utilization',
          icon: Share2,
          iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
          badge: 'Master Data',
          badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
        },
      ]
    },
    {
      title: 'ระบบบริการและกิจกรรม (Services & Operations)',
      subtitle: 'พิจารณาคำขอรับรองจริยธรรม บริการทรัพย์สินทางปัญญา และคลินิกปรึกษางานวิจัย',
      items: [
        {
          title: 'จริยธรรมการวิจัย (Research Ethics IRB)',
          desc: 'พิจารณาโครงร่างวิจัย มอบหมายผู้ทรงคุณวุฒิประเมินผล และจัดการแบบฟอร์มเอกสาร',
          href: '/master/ethics',
          icon: ClipboardCheck,
          iconBg: 'bg-teal-50 text-teal-700 border-teal-200',
          badge: pendingEthicsCount > 0 ? `${pendingEthicsCount} คำขอค้าง` : 'Services',
          badgeStyle: pendingEthicsCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-300 font-black' : 'bg-[#E8F6F5] text-[#00796B] border-[#BCE5E2]',
        },
        {
          title: 'บริการทรัพย์สินทางปัญญา (IP Services)',
          desc: 'ติดตามและจัดการคำขอยื่นขึ้นทะเบียนทรัพย์สินทางปัญญาและเอกสารดาวน์โหลดทางการ',
          href: '/master/ip',
          icon: FileCheck,
          iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
          badge: pendingIpCount > 0 ? `${pendingIpCount} คำขอค้าง` : 'Services',
          badgeStyle: pendingIpCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-300 font-black' : 'bg-[#E8F6F5] text-[#00796B] border-[#BCE5E2]',
        },
        {
          title: 'คลินิกวิจัยและสัมมนา (Research Clinic)',
          desc: 'จัดการตารางนัดหมายขอคำปรึกษางานวิจัย หัวข้อสัมมนาวิชาการ และการลงทะเบียน',
          href: '/master/clinic',
          icon: Calendar,
          iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          badge: pendingAppointmentsCount > 0 ? `${pendingAppointmentsCount} นัดหมายค้าง` : 'Services',
          badgeStyle: pendingAppointmentsCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-300 font-black' : 'bg-[#E8F6F5] text-[#00796B] border-[#BCE5E2]',
        },
      ]
    }
  ]

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* PENDING SUMMARY BANNER */}
      {(pendingAppointmentsCount > 0 || pendingEthicsCount > 0 || pendingIpCount > 0) && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-900 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="text-xs font-mono font-extrabold text-teal-300 uppercase tracking-wider">รายการค้างดำเนินการ (Pending Inbox)</div>
              <div className="text-sm font-bold mt-0.5 text-slate-100">
                มี {pendingAppointmentsCount + pendingEthicsCount + pendingIpCount} รายการรอแอดมินดำเนินการตรวจสอบและอนุมัติ
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pendingEthicsCount > 0 && (
              <Link href="/master/ethics" className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-extrabold transition">
                จริยธรรม ({pendingEthicsCount})
              </Link>
            )}
            {pendingIpCount > 0 && (
              <Link href="/master/ip" className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-extrabold transition">
                IP ({pendingIpCount})
              </Link>
            )}
            {pendingAppointmentsCount > 0 && (
              <Link href="/master/clinic" className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-extrabold transition">
                นัดหมาย ({pendingAppointmentsCount})
              </Link>
            )}
          </div>
        </div>
      )}

      {/* SECTIONS GRID */}
      {sections.map((section, idx) => (
        <div key={idx} className="space-y-4">
          <div className="border-b border-slate-200/80 pb-2">
            <h2 className="text-sm sm:text-base font-black text-[#0F172A] tracking-tight">{section.title}</h2>
            <p className="text-xs text-[#64748B] font-semibold mt-0.5">{section.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {section.items.map((item, itemIdx) => {
              const IconComp = item.icon
              return (
                <div
                  key={itemIdx}
                  className="p-5 rounded-3xl bg-white border border-[#E2E8F0] hover:border-[#00796B] hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-2xs ${item.iconBg}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${item.badgeStyle}`}>
                        {item.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-[#0F172A] group-hover:text-[#00796B] transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#64748B] font-semibold mt-1 leading-relaxed line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={item.href}
                    className="w-full py-2.5 px-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] group-hover:bg-[#00796B] group-hover:text-white group-hover:border-[#00796B] text-[#0F172A] text-xs font-black transition-all flex items-center justify-between"
                  >
                    <span>เข้าสู่หน้าจัดการ</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
