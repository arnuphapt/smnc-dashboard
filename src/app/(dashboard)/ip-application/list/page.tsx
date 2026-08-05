'use client'

import React from 'react'
import { IPApplicationList } from '@/components/views/IPApplicationList'
import { useRequirePageAccess } from '@/hooks/useRequirePageAccess'

export default function IpApplicationListPage() {
  useRequirePageAccess('ip_application_list')
  return <IPApplicationList />
}
