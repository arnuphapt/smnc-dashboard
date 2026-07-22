import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { MasterProvider } from '@/context/MasterContext'
import { QueryProvider } from '@/lib/query/QueryProvider'

export const metadata: Metadata = {
  title: 'คลังปัญญา SMNC - Digital Research Workspace',
  description: 'ระบบบริหารจัดการงานวิจัย นวัตกรรม และทรัพย์สินทางปัญญา วิทยาลัยพยาบาลศรีมหาสารคาม',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 antialiased">
        <QueryProvider>
          <AuthProvider>
            <MasterProvider>
              {children}
            </MasterProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
