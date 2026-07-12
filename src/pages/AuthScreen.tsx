import React, { useState } from 'react'
import { supabase } from '../services/supabase'
import { Shield, Mail, Lock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { isValidSmncEmail } from '../utils/validation'

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4" style={{ background: '#F0F7FF' }}>
      {/* Background mesh — same language as page headers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 30%, rgba(14,165,160,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(11,29,58,0.07) 0%, transparent 50%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: '1px solid #DAEEFF' }}>
          
          {/* Top Navy band */}
          <div
            className="px-8 pt-8 pb-6 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0B1D3A 0%, #1A3A5C 100%)' }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: 'radial-gradient(ellipse at 70% 20%, rgba(14,165,160,0.3) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                style={{ background: 'rgba(14,165,160,0.2)', border: '1px solid rgba(14,165,160,0.4)' }}
              >
                <Shield className="w-8 h-8 stroke-[2.5]" style={{ color: '#0EA5A0' }} />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">Research Workspace</h1>
              <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                วิทยาลัยพยาบาลศรีมหาสารคาม (SMNC)
              </p>
            </div>
          </div>

          {/* Form area */}
          <div className="px-8 py-7">
            {/* Tab Buttons */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: '#F0F7FF', border: '1px solid #DAEEFF' }}>
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
                    ? { background: '#0B1D3A', color: '#FFFFFF', boxShadow: '0 1px 4px rgba(11,29,58,0.2)' }
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
                <label className="block text-[10px] font-extrabold uppercase tracking-[0.12em] mb-1.5" style={{ color: '#0EA5A0' }}>
                  อีเมลวิทยาลัย (@smnc.ac.th)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@smnc.ac.th"
                    className="w-full py-2.5 pl-10 pr-4 text-sm light-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-[0.12em] mb-1.5" style={{ color: '#0EA5A0' }}>
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-2.5 pl-10 pr-4 text-sm light-input"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="flex gap-2.5 px-4 py-3 rounded-xl text-xs" style={{ background: 'rgba(14,165,160,0.08)', border: '1px solid rgba(14,165,160,0.25)', color: '#0B1D3A' }}>
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: '#0EA5A0' }} />
                  <div>
                    <strong>หมายเหตุ:</strong> ระบบจะใช้โดเมนอีเมลในการกำหนดสิทธิ์เข้าใช้งาน
                    ผู้ที่สมัครคนแรกจะได้รับสิทธิ์ <strong>ผู้ดูแลระบบ (Admin)</strong> โดยอัตโนมัติ
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isLogin ? 'เข้าสู่ระบบ →' : 'สร้างบัญชีผู้ใช้ →'}
              </button>
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
