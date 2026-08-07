'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      return
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    setLoading(true)
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) throw updateErr

      setSuccess(true)
      toast.success('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว')
      setTimeout(() => {
        router.replace('/login')
      }, 2000)
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4" style={{ background: '#EFF8F7' }}>
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div
            className="px-8 pt-8 pb-6 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #F2F8F7 50%, #F0F7FF 100%)', borderBottom: '1px solid #E2E8F0' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm bg-teal-50 border border-teal-200">
              <Shield className="w-7 h-7 stroke-[2.5] text-[#00796B]" />
            </div>
            <h1 className="text-lg font-black text-slate-800">ตั้งรหัสผ่านใหม่</h1>
            <p className="text-xs text-slate-500 mt-0.5">กรอกรหัสผ่านใหม่สำหรับบัญชีผู้ใช้งานของคุณ</p>
          </div>

          <div className="px-8 py-7">
            {error && (
              <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs bg-rose-50 text-rose-900 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-6 space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
                <h3 className="text-sm font-black text-slate-800">ตั้งรหัสผ่านใหม่สำเร็จ!</h3>
                <p className="text-xs text-slate-500">ระบบกำลังนำคุณไปยังหน้าเข้าสู่ระบบ...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    รหัสผ่านใหม่ *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-2.5 pl-10 pr-4 h-auto text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    ยืนยันรหัสผ่านใหม่ *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-2.5 pl-10 pr-4 h-auto text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full h-auto flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่ →'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
