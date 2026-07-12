import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthScreen } from './AuthScreen'

const signInWithPassword = vi.fn()
const signUp = vi.fn()

vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      signUp: (...args: unknown[]) => signUp(...args),
    },
  },
}))

beforeEach(() => {
  signInWithPassword.mockReset()
  signUp.mockReset()
})

describe('AuthScreen', () => {
  it('rejects emails outside the @smnc.ac.th domain without calling supabase', async () => {
    render(<AuthScreen />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('username@smnc.ac.th'), 'someone@gmail.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ →' }))

    expect(await screen.findByText(/@smnc\.ac\.th เท่านั้น/)).toBeInTheDocument()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('signs in with a valid @smnc.ac.th email', async () => {
    signInWithPassword.mockResolvedValueOnce({ error: null })
    render(<AuthScreen />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('username@smnc.ac.th'), 'teacher@smnc.ac.th')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ →' }))

    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'teacher@smnc.ac.th', password: 'password123' })
  })

  it('switches to sign-up mode and calls supabase signUp', async () => {
    signUp.mockResolvedValueOnce({ error: null })
    render(<AuthScreen />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }))
    await user.type(screen.getByPlaceholderText('username@smnc.ac.th'), 'newuser@smnc.ac.th')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: 'สร้างบัญชีผู้ใช้ →' }))

    expect(signUp).toHaveBeenCalledWith({ email: 'newuser@smnc.ac.th', password: 'password123' })
    expect(await screen.findByText(/ลงทะเบียนสำเร็จ/)).toBeInTheDocument()
  })
})
