import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthScreen } from './AuthScreen'
import { toast } from 'sonner'

const mockSignInWithPassword = jest.fn()
const mockSignUp = jest.fn()
const mockResetPasswordForEmail = jest.fn()

jest.mock('@/lib/supabase/client', () => {
  return {
    createClient: () => ({
      auth: {
        signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
        signUp: (...args: any[]) => mockSignUp(...args),
        resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
      },
    }),
  }
})

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('AuthScreen component (Login & Registration Flow)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login tab by default with email, password fields and header', () => {
    render(<AuthScreen />)

    expect(screen.getByText('Research Workspace')).toBeInTheDocument()
    expect(screen.getByText('วิทยาลัยพยาบาลศรีมหาสารคาม (SMNC)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('username@smnc.ac.th')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /เข้าสู่ระบบ →/i })).toBeInTheDocument()
    expect(screen.getByText('ลืมรหัสผ่าน?')).toBeInTheDocument()
  })

  it('submits login form with user credentials when login button is clicked', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })

    render(<AuthScreen />)

    fireEvent.change(screen.getByPlaceholderText('username@smnc.ac.th'), {
      target: { value: 'testuser@smnc.ac.th' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /เข้าสู่ระบบ →/i }))

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'testuser@smnc.ac.th',
        password: 'password123',
      })
      expect(toast.success).toHaveBeenCalledWith('เข้าสู่ระบบสำเร็จ')
    })
  })

  it('displays error alert when login fails', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid login credentials' },
    })

    render(<AuthScreen />)

    fireEvent.change(screen.getByPlaceholderText('username@smnc.ac.th'), {
      target: { value: 'wronguser@smnc.ac.th' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpass' },
    })

    fireEvent.click(screen.getByRole('button', { name: /เข้าสู่ระบบ →/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })
  })

  it('switches to registration tab and validates @smnc.ac.th email domain restriction', async () => {
    render(<AuthScreen />)

    // Switch to Register tab
    fireEvent.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }))

    expect(screen.getByRole('button', { name: /สร้างบัญชีผู้ใช้ →/i })).toBeInTheDocument()
    expect(screen.getByText(/ผู้ที่สมัครคนแรกจะได้รับสิทธิ์/i)).toBeInTheDocument()

    // Try submitting with external gmail address
    fireEvent.change(screen.getByPlaceholderText('username@smnc.ac.th'), {
      target: { value: 'someuser@gmail.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /สร้างบัญชีผู้ใช้ →/i }))

    await waitFor(() => {
      expect(screen.getByText('ขออภัย! การสมัครสมาชิกด้วยตนเอง อนุญาตเฉพาะอีเมลโดเมน @smnc.ac.th เท่านั้น')).toBeInTheDocument()
      expect(mockSignUp).not.toHaveBeenCalled()
    })
  })

  it('submits registration form with valid @smnc.ac.th email', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'new-u1', identities: [{ id: 'id1' }] } },
      error: null,
    })

    render(<AuthScreen />)

    fireEvent.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }))

    fireEvent.change(screen.getByPlaceholderText('username@smnc.ac.th'), {
      target: { value: 'newteacher@smnc.ac.th' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'securepass123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /สร้างบัญชีผู้ใช้ →/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'newteacher@smnc.ac.th',
        password: 'securepass123',
      })
      expect(screen.getByText(/ลงทะเบียนสำเร็จ! บัญชีของคุณถูกลงทะเบียนแล้ว กรุณารอผู้ดูแลระบบ/i)).toBeInTheDocument()
    })
  })

  it('opens Forgot Password modal and submits password reset request', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null })

    render(<AuthScreen />)

    fireEvent.click(screen.getByText('ลืมรหัสผ่าน?'))

    expect(screen.getByText('กรุณาระบุอีเมลที่คุณใช้สมัครสมาชิก ระบบจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณ')).toBeInTheDocument()

    const emailInputs = screen.getAllByPlaceholderText('username@smnc.ac.th')
    fireEvent.change(emailInputs[emailInputs.length - 1], {
      target: { value: 'forgotuser@smnc.ac.th' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'ส่งลิงก์รีเซ็ต' }))

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('forgotuser@smnc.ac.th', {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      })
      expect(toast.success).toHaveBeenCalledWith('ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว')
    })
  })
})
