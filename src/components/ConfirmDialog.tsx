import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog'
import { AlertTriangle, Trash2, Info } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary' | 'warning'
  loading?: boolean
  alertOnly?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  variant = 'primary',
  loading = false,
  alertOnly = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-8 h-8 text-rose-600 animate-pulse" />
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-600" />
      default:
        return <Info className="w-8 h-8 text-[#0EA5A0]" />
    }
  }

  const getHeaderBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50/50 border-rose-100'
      case 'warning':
        return 'bg-amber-50/50 border-amber-100'
      default:
        return 'bg-teal-50/30 border-teal-100/50'
    }
  }

  const getConfirmStyle = () => {
    switch (variant) {
      case 'danger':
        return { background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)', color: '#FFFFFF' }
      case 'warning':
        return { background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', color: '#FFFFFF' }
      default:
        return { background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)', color: '#FFFFFF' }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-[360px] w-full p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl border border-slate-200 animate-fadeIn">
        <div className={`p-6 flex flex-col items-center text-center space-y-4 border-b ${getHeaderBg()}`}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white shadow-md border border-slate-100 shrink-0">
            {getIcon()}
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-sm font-black text-slate-900 leading-snug">
              {title}
            </DialogTitle>
            <DialogDescription className="text-[11px] font-semibold text-slate-500 leading-relaxed max-w-[280px] mx-auto">
              {description}
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100 rounded-b-2xl">
          {!alertOnly && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 cursor-pointer focus:outline-none active:scale-[0.98]"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={alertOnly ? onClose : onConfirm}
            disabled={loading}
            className={`h-9 px-5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none active:scale-[0.98] ${alertOnly ? 'w-full' : ''}`}
            style={getConfirmStyle()}
          >
            {loading ? (
              <span className="flex items-center gap-1.5 justify-center">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                รอสักครู่...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
