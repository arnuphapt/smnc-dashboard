import React from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs } from './Breadcrumbs'

// Shared across every feature page (Clinic, Ethics, IP Application, Admin) so
// the masthead — plain heading + description, no card chrome — has exactly
// one source of truth instead of drifting copies. A tab is either
// state-driven (onClick via onTabChange, used by pages with local sub-tab
// state) or route-driven (`to`, used by Admin so its sections are real
// deep-linkable URLs) — same underline style either way. `divider` renders a
// hairline separator for grouping related tabs.
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
  /** Small monospace tag on the right of the meta row, e.g. "CLN-01" — the record-code signature repeated on every page header. */
  recordCode?: string
  /** Shrinks the header for single-screen dashboard-grid pages (Clinic/Ethics/IP Application). */
  compact?: boolean
}

const TabBadge: React.FC<{ count: number; isActive: boolean }> = ({ count, isActive }) => (
  <span
    className="text-[9px] font-mono font-extrabold rounded-full min-w-[1.15rem] h-[1.15rem] px-1 flex items-center justify-center"
    style={isActive
      ? { background: 'rgba(14,165,160,0.15)', color: '#0EA5A0' }
      : { background: '#FFF8EC', color: '#B45309' }}
  >
    {count}
  </span>
)

const MetaRow: React.FC<{ extraBadge?: string; recordCode?: string }> = ({ extraBadge, recordCode }) => (
  <div className="flex items-center justify-between gap-3">
    {extraBadge && (
      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: '#64748B' }}>
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
          <h1 className="header-display text-lg font-bold leading-tight truncate" style={{ color: '#0B1D3A' }}>{title}</h1>
          <p className="text-xs font-medium truncate" style={{ color: '#64748B' }}>{subtitle}</p>
        </div>
        {recordCode && <span className="record-tag shrink-0">REC · {recordCode}</span>}
      </div>
    ) : (
      <div>
        <Breadcrumbs />
        <MetaRow extraBadge={extraBadge} recordCode={recordCode} />
        <h1 className="header-display text-[1.75rem] font-bold leading-tight mt-2 mb-1" style={{ color: '#0B1D3A' }}>{title}</h1>
        <p className="text-sm font-medium" style={{ color: '#64748B' }}>{subtitle}</p>

        {/* Underline tabs */}
        {tabs && tabs.length > 0 && (
          <div className="flex items-center gap-1 mt-5 overflow-x-auto" style={{ borderBottom: '1px solid #E2EDF8' }}>
            {tabs.map((tab, idx) => {
              if (tab.divider) {
                return (
                  <span
                    key={`divider-${idx}`}
                    className="w-px h-5 shrink-0 mx-1.5"
                    style={{ background: '#E2EDF8' }}
                  />
                )
              }

              const isActive = activeTab === tab.key
              const className = "flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold cursor-pointer whitespace-nowrap transition-colors duration-200 shrink-0 border-b-2 -mb-px"
              const style: React.CSSProperties = {
                color: isActive ? '#0B1D3A' : '#94A3B8',
                borderBottomColor: isActive ? '#0EA5A0' : 'transparent',
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
        )}
      </div>
    )}
  </div>
)

// Repeated "eyebrow label + section title" header used to open every stacked
// section on the single-page Clinic/Ethics/IP Application layouts.
export const SectionHeader: React.FC<{ eyebrow: string; title: string }> = ({ eyebrow, title }) => (
  <div>
    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>{eyebrow}</p>
    <h3 className="text-base font-black" style={{ color: '#0B1D3A' }}>{title}</h3>
  </div>
)

interface ContentPanelProps {
  children: React.ReactNode
  /** Applied to the outer bordered card — pass a fixed height (e.g. "h-[380px]") for grid layouts. */
  className?: string
  /** Applied to the inner padded wrapper; defaults to "p-8". Pass e.g. "p-5 flex-1 min-h-0 flex flex-col" for scrollable grid cells. */
  bodyClassName?: string
}

export const ContentPanel: React.FC<ContentPanelProps> = ({ children, className, bodyClassName }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm flex flex-col ${className || ''}`}
    style={{ border: '1px solid #E2EDF8' }}
  >
    <div className={bodyClassName || 'p-8'}>{children}</div>
  </div>
)
