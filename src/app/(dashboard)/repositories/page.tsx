'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Lightbulb,
  Award,
  Trophy,
  Share2,
  ArrowRight,
  Sparkles,
  Layers,
  Search,
  FileCheck
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { createClient } from '@/lib/supabase/client'
import { useRequirePageAccess } from '@/hooks/useRequirePageAccess'

const supabase = createClient()

interface CategoryCount {
  research: number
  innovation: number
  intellectual_property: number
  award: number
  utilization: number
}

export default function RepositoriesLandingPage() {
  useRequirePageAccess('repositories')
  const [counts, setCounts] = useState<CategoryCount>({
    research: 0,
    innovation: 0,
    intellectual_property: 0,
    award: 0,
    utilization: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data, error } = await supabase
          .from('wisdom_items')
          .select('category')

        if (error) throw error

        const newCounts: CategoryCount = {
          research: 0,
          innovation: 0,
          intellectual_property: 0,
          award: 0,
          utilization: 0,
        }

        if (data) {
          data.forEach((item: { category: string }) => {
            if (item.category in newCounts) {
              newCounts[item.category as keyof CategoryCount]++
            }
          })
        }

        setCounts(newCounts)
      } catch (err) {
        console.error('Error fetching repository counts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [])

  const repoCards = [
    {
      id: 'research',
      title: 'คลังผลงานวิจัย',
      englishTitle: 'Research Repository',
      desc: 'รวบรวมและเผยแพร่ผลงานวิจัย บทความวารสารวิชาการ ตีพิมพ์ระดับชาติและนานาชาติของคณาจารย์และนักวิจัย',
      href: '/repositories/research',
      icon: BookOpen,
      count: counts.research,
      countUnit: 'บทความวิจัย',
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderColor: 'group-hover:border-amber-500/40',
      iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
      badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
      btnStyle: 'group-hover:bg-amber-600 group-hover:border-amber-600',
    },
    {
      id: 'innovation',
      title: 'คลังนวัตกรรม',
      englishTitle: 'Innovation Repository',
      desc: 'รวบรวมนวัตกรรมทางการพยาบาล สิ่งประดิษฐ์ งานสร้างสรรค์ สื่อการเรียนรู้ และซอฟต์แวร์ต้นแบบ',
      href: '/repositories/innovation',
      icon: Lightbulb,
      count: counts.innovation,
      countUnit: 'นวัตกรรม',
      gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      borderColor: 'group-hover:border-rose-500/40',
      iconBg: 'bg-rose-100 text-rose-700 border-rose-200',
      badgeStyle: 'bg-rose-50 text-rose-800 border-rose-200',
      btnStyle: 'group-hover:bg-rose-600 group-hover:border-rose-600',
    },
    {
      id: 'intellectual_property',
      title: 'คลังทรัพย์สินทางปัญญา',
      englishTitle: 'Intellectual Property',
      desc: 'รวบรวมข้อมูลสิทธิบัตร อนุสิทธิบัตร ลิขสิทธิ์ และเครื่องหมายการค้าที่ได้รับการจดทะเบียนคุ้มครองสิทธิ์',
      href: '/repositories/intellectual_property',
      icon: Award,
      count: counts.intellectual_property,
      countUnit: 'รายการสิทธิ์',
      gradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
      borderColor: 'group-hover:border-cyan-500/40',
      iconBg: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      badgeStyle: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      btnStyle: 'group-hover:bg-cyan-600 group-hover:border-cyan-600',
    },
    {
      id: 'award',
      title: 'คลังรางวัลและความสำเร็จ',
      englishTitle: 'Awards & Recognition',
      desc: 'รวบรวมรางวัลเชิดชูเกียรติ ผลงานดีเด่น และความสำเร็จระดับสถาบัน ชุมชน ระดับชาติและนานาชาติ',
      href: '/repositories/award',
      icon: Trophy,
      count: counts.award,
      countUnit: 'รางวัลเชิดชูเกียรติ',
      gradient: 'from-yellow-500/10 via-yellow-500/5 to-transparent',
      borderColor: 'group-hover:border-yellow-500/40',
      iconBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      badgeStyle: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      btnStyle: 'group-hover:bg-yellow-600 group-hover:border-yellow-600',
    },
    {
      id: 'utilization',
      title: 'เอกสารการนำผลงานไปใช้ประโยชน์',
      englishTitle: 'Research Utilization',
      desc: 'รวบรวมหลักฐานและบันทึกการนำผลงานวิจัยและนวัตกรรมไปใช้ประโยชน์จริงในเชิงพาณิชย์ ชุมชน หรือนโยบาย',
      href: '/repositories/utilization',
      icon: Share2,
      count: counts.utilization,
      countUnit: 'ผลงานใช้ประโยชน์',
      gradient: 'from-teal-500/10 via-teal-500/5 to-transparent',
      borderColor: 'group-hover:border-teal-500/40',
      iconBg: 'bg-teal-100 text-teal-700 border-teal-200',
      badgeStyle: 'bg-teal-50 text-teal-800 border-teal-200',
      btnStyle: 'group-hover:bg-teal-600 group-hover:border-teal-600',
    },
  ]

  const totalItems = Object.values(counts).reduce((acc, curr) => acc + curr, 0)

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800">
      <Breadcrumbs />

      {/* Hero Banner Section */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-br from-[#0B1D3A] via-[#1A3A5C] to-[#0EA5A0] text-white shadow-xl border border-teal-700/30">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-teal-200 text-xs font-mono font-extrabold tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>SMNC DIGITAL WISDOM REPOSITORIES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
            คลังปัญญาดิจิทัล 5 ด้าน
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
            วิทยาลัยพยาบาลศรีมหาสารคาม — ศูนย์รวมและเผยแพร่ผลงานวิจัย นวัตกรรม ทรัพย์สินทางปัญญา รางวัลเชิดชูเกียรติ และการนำไปใช้ประโยชน์เพื่อการพัฒนาอย่างยั่งยืน
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs font-bold text-teal-100">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-300" />
              <span>รวมทั้งหมด <strong className="text-white font-mono font-black text-sm">{loading ? '...' : totalItems}</strong> รายการ</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-teal-300" />
              <span>5 หมวดหมู่คลังปัญญา</span>
            </div>
          </div>
        </div>
      </div>

      {/* Repositories Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-base font-black text-[#0F172A]">เลือกหมวดหมู่คลังปัญญา</h2>
            <p className="text-xs text-[#64748B] font-semibold mt-0.5">กดเลือกหมวดหมู่เพื่อค้นหาและเรียกดูผลงานในคลัง</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {repoCards.map((card) => {
            const IconComponent = card.icon
            return (
              <div
                key={card.id}
                className={`group relative p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 overflow-hidden ${card.borderColor}`}
              >
                {/* Background Subtle Gradient Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                <div className="relative z-10 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${card.iconBg}`}>
                      <IconComponent className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold border ${card.badgeStyle}`}>
                      {loading ? '...' : `${card.count} ${card.countUnit}`}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-[#0F172A] group-hover:text-[#00796B] transition-colors leading-snug">
                      {card.title}
                    </h3>
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {card.englishTitle}
                    </div>
                    <p className="text-xs text-[#64748B] font-semibold leading-relaxed line-clamp-3">
                      {card.desc}
                    </p>
                  </div>
                </div>

                <Link
                  href={card.href}
                  className={`relative z-10 w-full py-2.5 px-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] group-hover:text-white text-[#0F172A] text-xs font-black transition-all flex items-center justify-between shadow-2xs ${card.btnStyle}`}
                >
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    เข้าสู่คลังข้อมูล
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
