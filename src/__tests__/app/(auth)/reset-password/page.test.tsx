import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResetPasswordPage from '@/app/(auth)/reset-password/page'
import { toast } from 'sonner'

const mockUpdateUser = jest.fn()
const mockReplace = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('ResetPasswordPage component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders reset password form header and fields', () => {
    render(<ResetPasswordPage />)

    expect(screen.getByText('ตั้งรหัสผ่านใหม่')).toBeInTheDocument()
    expect(screen.getByText('กรอกรหัสผ่านใหม่สำหรับบัญชีผู้ใช้งานของคุณ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /บันทึกรหัสผ่านใหม่ →/i })).toBeInTheDocument()
  })

  it('shows error if password is less than 6 characters', async () => {
    render(<ResetPasswordPage />)

    const inputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(inputs[0], { target: { value: '12345' } })
    fireEvent.change(inputs[1], { target: { value: '12345' } })

    fireEvent.click(screen.getByRole('button', { name: /บันทึกรหัสผ่านใหม่ →/i }))

    await waitFor(() => {
      expect(screen.getByText('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')).toBeInTheDocument()
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })
  })

  it('shows error if password and confirm password do not match', async () => {
    render(<ResetPasswordPage />)

    const inputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(inputs[0], { target: { value: 'password123' } })
    fireEvent.change(inputs[1], { target: { value: 'mismatch123' } })

    fireEvent.click(screen.getByRole('button', { name: /บันทึกรหัสผ่านใหม่ →/i }))

    await waitFor(() => {
      expect(screen.getByText('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')).toBeInTheDocument()
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })
  })

  it('submits new password to supabase auth on valid input', async () => {
    mockUpdateUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })

    render(<ResetPasswordPage />)

    const inputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(inputs[0], { target: { value: 'newsecurepass123' } })
    fireEvent.change(inputs[1], { target: { value: 'newsecurepass123' } })

    fireEvent.click(screen.getByRole('button', { name: /บันทึกรหัสผ่านใหม่ →/i }))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newsecurepass123' })
      expect(toast.success).toHaveBeenCalledWith('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว')
      expect(screen.getByText('ตั้งรหัสผ่านใหม่สำเร็จ!')).toBeInTheDocument()
    })
  })
})
