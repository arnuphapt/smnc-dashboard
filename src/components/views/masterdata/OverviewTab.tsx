'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Users,
  BookOpen,
  Award,
  Lightbulb,
  Trophy,
  Share2,
  Calendar,
  ArrowRight,
  ChevronRight,
  Clipboard,
  Settings
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
          title: 'ประเภทงานวิจัย (Master Creator Type)',
          desc: 'จัดการข้อมูลตัวเลือกประเภทงานวิจัย/ผู้จัดทำ',
          href: '/master/masters/research_type',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'ภาควิชา (Master Department)',
          desc: 'จัดการข้อมูลตัวเลือกภาควิชา',
          href: '/master/masters/department',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'ประเภททรัพย์สินทางปัญญา (Master IP Type)',
          desc: 'จัดการข้อมูลตัวเลือกประเภททรัพย์สินทางปัญญา',
          href: '/master/masters/ip_type',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'ระดับรางวัล (Master Award Level)',
          desc: 'จัดการข้อมูลตัวเลือกระดับรางวัล',
          href: '/master/masters/award_level',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'ประเภทการนำไปใช้ประโยชน์ (Master Utilization Type)',
          desc: 'จัดการข้อมูลตัวเลือกประเภทการนำไปใช้ประโยชน์',
          href: '/master/masters/utilization_type',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'ระดับวารสาร (Master Journal Rank)',
          desc: 'จัดการข้อมูลตัวเลือกระดับวารสารวิชาการ',
          href: '/master/masters/journal_rank',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'ขอบเขตงาน (Master Scope)',
          desc: 'จัดการข้อมูลตัวเลือกขอบเขตงานวิจัย',
          href: '/master/masters/scope',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'ประเภทนวัตกรรม (Master Innovation Type)',
          desc: 'จัดการข้อมูลตัวเลือกประเภทนวัตกรรม',
          href: '/master/masters/innovation_type',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'แหล่งที่มา (Master Source)',
          desc: 'จัดการข้อมูลตัวเลือกแหล่งที่มาของผลงาน',
          href: '/master/masters/source',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'สถานะทรัพย์สินทางปัญญา (Master IP Status)',
          desc: 'จัดการข้อมูลตัวเลือกสถานะทรัพย์สินทางปัญญา',
          href: '/master/masters/ip_current_status',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'สถานที่จัดงาน (Master Venue)',
          desc: 'จัดการข้อมูลตัวเลือกสถานที่จัดงาน/ตีพิมพ์',
          href: '/master/masters/venue',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'ปี พ.ศ. (Master Year)',
          desc: 'จัดการข้อมูลตัวเลือกปี พ.ศ.',
          href: '/master/masters/year',
          icon: Settings,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'System Settings',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'เกณฑ์จริยธรรม (Master Ethics Criteria)',
          desc: 'จัดการข้อมูลตัวเลือกเกณฑ์การพิจารณาจริยธรรม',
          href: '/master/masters/ethics_criteria',
          icon: Settings,
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
          title: 'กิจกรรมและอบรม (Events)',
          desc: 'จัดการปฏิทินกิจกรรม อบรม และสัมมนาวิชาการของสถาบัน',
          href: '/master/event',
          icon: Calendar,
          iconBg: 'bg-violet-50 text-violet-700 border-violet-200',
          badge: 'Services',
          badgeStyle: 'bg-[#E8F6F5] text-[#00796B] border-[#BCE5E2]',
        },
        {
          title: 'แบบฟอร์มและเอกสารดาวน์โหลด (Downloadable Forms)',
          desc: 'จัดการแบบฟอร์มจริยธรรม เอกสาร IP และเอกสารการนำผลงานวิจัยไปใช้ประโยชน์',
          href: '/master/forms',
          icon: Clipboard,
          iconBg: 'bg-orange-50 text-orange-700 border-orange-200',
          badge: 'Services',
          badgeStyle: 'bg-[#E8F6F5] text-[#00796B] border-[#BCE5E2]',
        },
      ]
    }
  ]

  return (
    <div className="space-y-8 animate-fadeIn">
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
