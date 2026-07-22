'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Mail, Lock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

const supabase = createClient()
import { isValidSmncEmail } from '@/utils/validation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const trimmedEmail = email.trim()

    if (!isValidSmncEmail(trimmedEmail)) {
      setError('ขออภัย! อนุญาตให้ใช้งานเฉพาะอีเมลโดเมน @smnc.ac.th เท่านั้น')
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password })
        if (signInError) throw signInError
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email: trimmedEmail, password })
        if (signUpError) throw signUpError
        setSuccess('ลงทะเบียนสำเร็จ! กรุณาตรวจสอบกล่องข้อความในอีเมลเพื่อยืนยันบัญชีผู้ใช้ก่อนเข้าสู่ระบบ')
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบหรือลงทะเบียน')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4" style={{ background: '#EFF8F7' }}>
      {/* Background mesh */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 30%, rgba(0,121,107,0.08) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(0,120,200,0.05) 0%, transparent 50%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-flip-card overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
          
          {/* Top Light Band */}
          <div
            className="px-8 pt-8 pb-6 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #F2F8F7 50%, #F0F7FF 100%)', borderBottom: '1px solid #E2E8F0' }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                backgroundImage: 'radial-gradient(ellipse at 70% 20%, rgba(0,121,107,0.10) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
                style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}
              >
                <Shield className="w-8 h-8 stroke-[2.5]" style={{ color: '#00796B' }} />
              </div>
              <h1 className="text-xl font-black tracking-tight" style={{ color: '#0F172A' }}>Research Workspace</h1>
              <p className="text-xs mt-1 font-medium" style={{ color: '#64748B' }}>
                วิทยาลัยพยาบาลศรีมหาสารคาม (SMNC)
              </p>
            </div>
          </div>

          {/* Form area */}
          <div className="px-8 py-7">
            {/* Tab Buttons */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: '#F2F8F7', border: '1px solid #E2E8F0' }}>
              {[
                { label: 'เข้าสู่ระบบ', value: true },
                { label: 'สมัครสมาชิก', value: false },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setIsLogin(value); setError(null); setSuccess(null) }}
                  className="flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer"
                  style={isLogin === value
                    ? { background: '#00796B', color: '#FFFFFF', boxShadow: '0 1px 6px rgba(0,121,107,0.25)' }
                    : { background: 'transparent', color: '#64748B' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs" style={{ background: '#FFF1F2', color: '#9F1239', border: '1px solid #FECDD3' }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-[0.12em] mb-1.5" style={{ color: '#64748B' }}>
                  อีเมลวิทยาลัย (@smnc.ac.th)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: '#94A3B8' }} />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@smnc.ac.th"
                    className="w-full py-2.5 pl-10 pr-4 h-auto text-sm light-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-[0.12em] mb-1.5" style={{ color: '#64748B' }}>
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: '#94A3B8' }} />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-2.5 pl-10 pr-4 h-auto text-sm light-input"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="flex gap-2.5 px-4 py-3 rounded-xl text-xs" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF', color: '#0F172A' }}>
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: '#00796B' }} />
                  <div>
                    <strong>หมายเหตุ:</strong> ระบบจะใช้โดเมนอีเมลในการกำหนดสิทธิ์เข้าใช้งาน
                    ผู้ที่สมัครคนแรกจะได้รับสิทธิ์ <strong>ผู้ดูแลระบบ (Admin)</strong> โดยอัตโนมัติ
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-auto flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isLogin ? 'เข้าสู่ระบบ →' : 'สร้างบัญชีผู้ใช้ →'}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-[10px] mt-4 font-medium" style={{ color: '#94A3B8' }}>
          © {new Date().getFullYear()} คลังปัญญาดิจิทัล วิทยาลัยพยาบาลศรีมหาสารคาม
        </p>
      </div>
    </div>
  )
}
