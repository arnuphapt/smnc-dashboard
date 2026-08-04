'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

const supabase = createClient()
import {
  FileText,
  Shield,
  BookMarked,
  Cpu,
  Tag,
  ArrowRight,
  Download,
  Sparkles,
  Clipboard,
  ClipboardList,
} from 'lucide-react'
import { PageHeader, ContentPanel, SectionHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'

interface DownloadableForm {
  id: string
  title: string
  file_url: string
  category: string
}

import { useIPForms, useIPApplications } from '@/hooks/queries/useIP'

export const IPApplicationSubmit: React.FC = () => {
  const { user } = useAuth()
  const { data: forms = [] } = useIPForms()
  const { data: myApps = [] } = useIPApplications(user?.id)
  const applicationCount = myApps.length

  const ipCategoryCards = [
    { title: 'สิทธิบัตร (Patents)', desc: 'การประดิษฐ์/กรรมวิธีใหม่ที่มีขั้นการประดิษฐ์สูงขึ้น', icon: Cpu, color: '#2BA8A2' },
    { title: 'อนุสิทธิบัตร (Petty Patents)', desc: 'การประดิษฐ์ใหม่ที่มีประโยชน์ในการปรับปรุงเทคโนโลยี', icon: Shield, color: '#FFD23F' },
    { title: 'ลิขสิทธิ์ (Copyrights)', desc: 'งานวรรณกรรม ซอฟต์แวร์ งานเขียน และผลงานสร้างสรรค์', icon: BookMarked, color: '#7D52E5' },
    { title: 'เครื่องหมายการค้า (Trademarks)', desc: 'ตราสินค้า สัญลักษณ์ และเครื่องหมายบริการ', icon: Tag, color: '#EF6C4A' },
  ]

  return (
    <div className="flex-1 space-y-6 animate-fadeIn">
      <PageHeader
        title="ทรัพย์สินทางปัญญา"
        subtitle="Intellectual Property — ยื่นขอขึ้นทะเบียนสิทธิ์ผลงาน"
        extraBadge="IP Registration System"
      />

      {/* HERO SECTION: INTELLECTUAL PROPERTY CATEGORIES */}
      <ContentPanel>
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-flip-card space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6F5] border border-[#BCE5E2] text-[#00796B] text-xs font-mono font-extrabold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INTELLECTUAL PROPERTY VAULT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                ประเภทการคุ้มครองทรัพย์สินทางปัญญา
              </h2>
            </div>
            {user && (
              <Link
                href="/ip-application/list"
                className="shrink-0 btn-primary text-xs flex items-center gap-2 !py-2.5 !px-5"
              >
                <ClipboardList className="w-4 h-4 stroke-[2.5]" />
                ดูรายการคำขอที่ยื่นแล้ว ({applicationCount})
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ipCategoryCards.map((cat, i) => {
              const IconComp = cat.icon
              return (
                <div key={i} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 hover:border-[#0F172A] transition group shadow-xs">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-[#E2E8F0] shadow-xs" style={{ color: cat.color }}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-xs text-[#0F172A] group-hover:text-[#00796B] transition-colors">{cat.title}</h4>
                  <p className="text-[10px] text-[#64748B] leading-relaxed font-semibold">{cat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </ContentPanel>

      {/* SECTION: GUIDANCE & LIFECYCLE STEPS */}
      <ContentPanel>
        <SectionHeader eyebrow="ขั้นตอนการดำเนินงาน" title="คู่มือและขั้นตอนการยื่นขอขึ้นทะเบียน IP" />
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { num: '01', title: 'เลือกประเภท & โหลดแบบฟอร์ม', detail: 'เลือกประเภทสิทธิ์ที่ต้องการยื่นและดาวน์โหลดแบบฟอร์มทางการ' },
              { num: '02', title: 'จัดเตรียมเอกสาร & หลักฐาน', detail: 'แนบคำพรรณนาการประดิษฐ์ ภาพถ่าย หรือซอร์สโค้ดให้ครบถ้วน' },
              { num: '03', title: 'ยื่นเอกสารที่งานวิจัยสถาบัน', detail: 'ส่งมอบเล่มเอกสารฉบับจริงให้เจ้าหน้าที่งานวิจัยและนวัตกรรม' },
              { num: '04', title: 'รับเลขคำขอ & โอนเข้าคลัง', detail: 'เจ้าหน้าที่บันทึกเข้าระบบ ออกเลขคำขอ และโอนเข้าคลังผลงาน' },
            ].map((step, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-[#0F172A] transition shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-[#00796B]">{step.num}</span>
                  <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F172A] transition-colors" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-[#0F172A] leading-snug">{step.title}</h5>
                  <p className="text-[10px] text-[#64748B] mt-1 leading-relaxed font-semibold">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ContentPanel>

      {/* SECTION: OFFICIAL FORMS GRID */}
      <ContentPanel>
        <SectionHeader eyebrow="แบบฟอร์มทางการ DIP" title="ดาวน์โหลดแบบฟอร์มยื่นขอขึ้นทะเบียนทรัพย์สินทางปัญญา" />
        <div className="mt-4">
          {forms.length === 0 ? (
            <EmptyState icon={<Clipboard className="w-10 h-10 stroke-[1.5]" />} title="ยังไม่มีแบบฟอร์มอัปโหลด" body="ติดต่องานวิจัยสถาบันเพื่อรับแบบฟอร์มทางอีเมล" dashed />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0F172A] transition duration-200 shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white border border-[#E2E8F0] text-[#00796B] shadow-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs truncate text-[#0F172A] group-hover:text-[#00796B] transition-colors" title={form.title}>{form.title}</p>
                      <p className="text-[10px] font-mono font-bold text-[#64748B] mt-0.5">แบบฟอร์มอย่างเป็นทางการ (DIP)</p>
                    </div>
                  </div>
                  <a
                    href={form.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 shrink-0 btn-gold text-xs flex items-center gap-1.5 !py-1.5 !px-3"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    ดาวน์โหลด
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </ContentPanel>
    </div>
  )
}
