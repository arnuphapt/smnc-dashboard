import React from 'react'
import { Link } from 'react-router-dom'

// Shared across every feature page (Clinic, Ethics, IP Application, Admin) so the
// navy→teal gradient banner + floating tab-pill pattern has exactly one source of
// truth instead of drifting copies. A tab is either state-driven (onClick via
// onTabChange, used by pages with local sub-tab state) or route-driven (`to`,
// used by Admin so its sections are real deep-linkable URLs) — same visual pill
// either way. `divider` renders a hairline separator for grouping related tabs
// without breaking the flat-row pattern.
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
  tabs: PageHeaderTab[]
  activeTab: string
  onTabChange?: (tab: string) => void
  extraBadge?: string
}

const TabBadge: React.FC<{ count: number; isActive: boolean }> = ({ count, isActive }) => (
  <span
    className="text-[9px] font-mono font-extrabold rounded-full min-w-[1.15rem] h-[1.15rem] px-1 flex items-center justify-center"
    style={isActive
      ? { background: 'rgba(11,29,58,0.15)', color: '#0B1D3A' }
      : { background: '#FFF8EC', color: '#B45309' }}
  >
    {count}
  </span>
)

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, tabs, activeTab, onTabChange, extraBadge }) => (
  <div
    className="relative overflow-hidden rounded-2xl mb-8"
    style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 60%, #0E3251 100%)' }}
  >
    {/* Subtle mesh overlay */}
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 80% 20%, rgba(14,165,160,0.25) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(14,165,160,0.12) 0%, transparent 50%)',
      }}
    />
    <div className="relative px-8 pt-8 pb-0">
      {extraBadge && (
        <span
          className="inline-block mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
          style={{ background: 'rgba(14,165,160,0.18)', color: '#0EA5A0', border: '1px solid rgba(14,165,160,0.4)' }}
        >
          {extraBadge}
        </span>
      )}
      <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-1">{title}</h1>
      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>{subtitle}</p>

      {/* Tab Pills — float on bottom edge of header */}
      <div className="flex items-center gap-2 mt-7 overflow-x-auto pb-px">
        {tabs.map((tab, idx) => {
          if (tab.divider) {
            return (
              <span
                key={`divider-${idx}`}
                className="w-px h-5 shrink-0 mx-0.5"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              />
            )
          }

          const isActive = activeTab === tab.key
          const className = "flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all duration-200 shrink-0"
          const style: React.CSSProperties = {
            background: isActive ? '#F0F7FF' : 'rgba(255,255,255,0.07)',
            color: isActive ? '#0B1D3A' : 'rgba(255,255,255,0.65)',
            borderBottom: isActive ? '2px solid #0EA5A0' : '2px solid transparent',
          }
          const content = (
            <>
              {tab.icon}
              {tab.label}
              {!!tab.badge && <TabBadge count={tab.badge} isActive={isActive} />}
            </>
          )

          if (tab.to) {
            return (
              <Link key={tab.key} to={tab.to} className={className} style={style}>
                {content}
              </Link>
            )
          }

          return (
            <button key={tab.key} onClick={() => onTabChange?.(tab.key)} className={className} style={style}>
              {content}
            </button>
          )
        })}
      </div>
    </div>
  </div>
)

export const ContentPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="bg-white rounded-2xl shadow-sm"
    style={{ border: '1px solid #E2EDF8' }}
  >
    <div className="p-8">{children}</div>
  </div>
)
