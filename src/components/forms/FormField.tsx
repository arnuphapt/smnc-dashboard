'use client'

import React from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  hint?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  children,
  hint,
}) => {
  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-xs font-bold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[10px] text-slate-400">{hint}</p>}
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  )
}
