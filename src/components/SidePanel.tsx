import React from 'react'
import { X } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'

// One consistent surface for "edit this record" across the admin console —
// replaces three different inline-edit-row hacks (appointments, ethics
// submissions, IP applications) that each turned a table row into a cramped
// 3-input form. Same visual language as the Items add/edit modal's header
// treatment, but slides from the right so the table stays visible for context.
// Built on shadcn's Sheet (dialog primitives) for focus-trap/ESC/portal
// behavior, with the SMNC navy-gradient header kept as bespoke markup.
interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const SidePanel: React.FC<SidePanelProps> = ({ open, onClose, title, subtitle, children, footer }) => {
  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-md! sm:max-w-md! flex-col gap-0 p-0 shadow-2xl"
      >
        <div className="px-6 py-5 shrink-0" style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1" style={{ color: '#0EA5A0' }}>แก้ไขรายการ</p>
              <h3 className="text-base font-black text-white truncate">{title}</h3>
              {subtitle && <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg shrink-0 transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: '#64748B' }}>
    {children}
  </label>
)
