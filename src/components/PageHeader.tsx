'use client'

import React from 'react'
import Link from 'next/link'
import { Breadcrumbs } from './Breadcrumbs'

export interface PageHeaderTab {
  key: string
  icon?: React.ReactNode
  label?: string
  badge?: number
  to?: string
  divider?: boolean
}

interface PageHeaderProps {
  title: string
  subtitle: string
  tabs?: PageHeaderTab[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  extraBadge?: string
  recordCode?: string
  compact?: boolean
}

const TabBadge: React.FC<{ count: number; isActive: boolean }> = ({ count, isActive }) => (
  <span
    className={`text-[9px] font-mono font-extrabold rounded-full min-w-[1.15rem] h-[1.15rem] px-1 flex items-center justify-center ${
      isActive ? 'bg-white text-[#0F172A]' : 'bg-[#F1F5F9] text-[#64748B]'
    }`}
  >
    {count}
  </span>
)

const MetaRow: React.FC<{ extraBadge?: string; recordCode?: string }> = ({ extraBadge, recordCode }) => (
  <div className="flex items-center justify-between gap-3">
    {extraBadge && (
      <span className="eyebrow-badge">
        SMNC · {extraBadge}
      </span>
    )}
    {recordCode && <span className="record-tag shrink-0">REC · {recordCode}</span>}
  </div>
)

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, tabs, activeTab, onTabChange, extraBadge, recordCode, compact }) => (
  <div className={compact ? 'shrink-0' : 'mb-6'}>
    {compact ? (
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="header-display text-xl font-extrabold leading-tight truncate text-[#0F172A]">{title}</h1>
          <p className="text-xs font-semibold truncate text-[#64748B]">{subtitle}</p>
        </div>
        {recordCode && <span className="record-tag shrink-0">REC · {recordCode}</span>}
      </div>
    ) : (
      <div>
        <Breadcrumbs />
        <MetaRow extraBadge={extraBadge} recordCode={recordCode} />
        <h1 className="header-display text-2xl sm:text-3xl font-black leading-tight mt-2 mb-1 text-[#0F172A]">{title}</h1>
        <p className="text-sm font-semibold text-[#64748B]">{subtitle}</p>

        {/* Flip7 Pill/Underline Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 border-b border-[#E2E8F0]">
            {tabs.map((tab, idx) => {
              if (tab.divider) {
                return (
                  <span
                    key={`divider-${idx}`}
                    className="w-px h-5 shrink-0 mx-1 bg-[#E2E8F0]"
                  />
                )
              }

              const isActive = activeTab === tab.key
              const className = `flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-full cursor-pointer whitespace-nowrap transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-[#00796B] text-white shadow-md shadow-[#00796B]/20 scale-[1.02]'
                  : 'text-[#0F172A] hover:bg-[#F1F5F9] hover:text-[#00796B]'
              }`

              const content = (
                <>
                  {tab.icon}
                  {tab.label}
                  {!!tab.badge && <TabBadge count={tab.badge} isActive={isActive} />}
                </>
              )

              if (tab.to) {
                return (
                  <Link key={tab.key} href={tab.to} className={className}>
                    {content}
                  </Link>
                )
              }

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange && onTabChange(tab.key)}
                  className={className}
                >
                  {content}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )}
  </div>
)

export const ContentPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-3xl p-6 shadow-flip-card bg-white border border-[#E2E8F0] ${className}`}>
    {children}
  </div>
)

export const SectionHeader: React.FC<{ eyebrow: string; title: string; subtitle?: string }> = ({ eyebrow, title, subtitle }) => (
  <div className="mb-4">
    <p className="eyebrow-badge mb-1.5">{eyebrow}</p>
    <h3 className="text-lg font-black text-[#0F172A]">{title}</h3>
    {subtitle && <p className="text-xs text-[#64748B] font-semibold mt-0.5">{subtitle}</p>}
  </div>
)
