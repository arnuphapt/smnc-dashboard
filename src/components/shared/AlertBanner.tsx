'use client'

import React from 'react'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

interface AlertBannerProps {
  type?: 'error' | 'success' | 'info'
  message: string
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ type = 'error', message }) => {
  if (!message) return null

  const styles = {
    error: {
      bg: 'bg-red-50 border-red-200 text-red-700',
      icon: <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />,
    },
    success: {
      bg: 'bg-teal-50 border-teal-200 text-teal-700',
      icon: <CheckCircle className="w-4 h-4 shrink-0 text-teal-500" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      icon: <Info className="w-4 h-4 shrink-0 text-blue-500" />,
    },
  }

  const current = styles[type]

  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${current.bg}`}>
      {current.icon}
      <span>{message}</span>
    </div>
  )
}
