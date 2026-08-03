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
      <head>
        <link rel="icon" href="/smnc_logo.png" type="image/png" />
        <link rel="shortcut icon" href="/smnc_logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/smnc_logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700;800&family=Noto+Serif+Thai:wght@600;700&family=Sarabun:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="min-h-screen bg-[#EFF8F7] text-[#1E8C86] antialiased selection:bg-[#FFD23F] selection:text-[#1E8C86]">
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
