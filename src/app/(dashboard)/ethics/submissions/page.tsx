'use client'

import React, { Suspense } from 'react'
import { EthicsSubmissions } from '@/components/views/EthicsSubmissions'
import { useRequirePageAccess } from '@/hooks/useRequirePageAccess'

export const dynamic = 'force-dynamic'

function SubmissionsContent() {
  useRequirePageAccess('ethics_submissions')
  return <EthicsSubmissions />
}

export default function EthicsSubmissionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">กำลังโหลดข้อมูล...</div>}>
      <SubmissionsContent />
    </Suspense>
  )
}
