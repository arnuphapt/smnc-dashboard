'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Repositories } from '@/components/views/Repositories'
import { useRequirePageAccess } from '@/hooks/useRequirePageAccess'

export default function RepositoriesCategoryPage() {
  const { category } = useParams<{ category: string }>()
  useRequirePageAccess(`repositories_${category}`)
  return <Repositories />
}
