'use client'

import { ClinicAppointments } from '@/components/views/ClinicAppointments'
import { useRequirePageAccess } from '@/hooks/useRequirePageAccess'

export default function ClinicAppointmentsPage() {
  useRequirePageAccess('clinic_appointments')
  return <ClinicAppointments />
}
