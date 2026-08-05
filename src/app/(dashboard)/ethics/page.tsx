'use client'

import React from 'react'
import { EthicsSubmit } from '@/components/views/EthicsSubmit'
import { useRequirePageAccess } from '@/hooks/useRequirePageAccess'

export default function EthicsPage() {
  useRequirePageAccess('ethics_submit')
  return <EthicsSubmit />
}
