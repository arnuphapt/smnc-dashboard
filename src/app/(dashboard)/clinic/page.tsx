'use client'

import React from 'react'
import { Clinic } from '@/components/views/Clinic'
import { useRequirePageAccess } from '@/hooks/useRequirePageAccess'

export default function ClinicPage() {
  useRequirePageAccess('clinic_request')
  return <Clinic />
}
