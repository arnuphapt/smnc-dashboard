import React, { useState } from 'react'
import { supabase } from '../services/supabase'
import { Shield, Mail, Lock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

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

    // Validate email domain
    if (!trimmedEmail.toLowerCase().endsWith('@smnc.ac.th')) {
      setError('ขออภัย! อนุญาตให้ใช้งานเฉพาะอีเมลโดเมน @smnc.ac.th เท่านั้น')
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        })
        if (signInError) throw signInError
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        })
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 p-4">
      {/* Background gradients - subtle medical/clinical soft circles */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-200/30 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 relative z-10 shadow-xl">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-700 flex items-center justify-center shadow-md shadow-cyan-600/10 mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Research Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold">วิทยาลัยพยาบาลศรีมหาสารคาม (SMNC)</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1.5 rounded-lg mb-6 border border-slate-200/80">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
              isLogin ? 'bg-cyan-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            เข้าสู่ระบบ (Sign In)
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
              !isLogin ? 'bg-cyan-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            สมัครสมาชิก (Sign Up)
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-800 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-emerald-800 text-xs">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              อีเมลวิทยาลัย (@smnc.ac.th)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@smnc.ac.th"
                className="w-full py-2.5 pl-9 pr-4 rounded-lg light-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-2.5 pl-9 pr-4 rounded-lg light-input text-xs"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="p-3 bg-cyan-50 border border-cyan-200/60 rounded-lg text-cyan-800 text-[11px] flex gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-cyan-600" />
              <div>
                <strong>หมายเหตุ:</strong> ระบบจะใช้โดเมนอีเมลในการกำหนดสิทธิ์เข้าใช้งาน 
                ผู้ที่สมัครใช้งานเป็นคนแรกของระบบจะได้รับการกำหนดสิทธิ์เป็น <strong>ผู้ดูแลระบบ (Admin)</strong> โดยอัตโนมัติ
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-sm text-xs cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isLogin ? (
              'เข้าสู่ระบบ (Sign In)'
            ) : (
              'สร้างบัญชี (Create Account)'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
