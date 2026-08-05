'use client'

import React from 'react'
import { IPApplicationSubmit } from '@/components/views/IPApplicationSubmit'
import { useRequirePageAccess } from '@/hooks/useRequirePageAccess'

export default function IpApplicationPage() {
  useRequirePageAccess('ip_application_submit')
  return <IPApplicationSubmit />
}
