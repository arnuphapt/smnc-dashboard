import { render, screen } from '@testing-library/react'
import LoginPage from './page'

const mockPush = jest.fn()
const mockReplace = jest.fn()
let mockUser: any = null
let mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}))

jest.mock('@/components/views/AuthScreen', () => ({
  AuthScreen: () => <div data-testid="auth-screen">Mock AuthScreen</div>,
}))

describe('LoginPage component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUser = null
    mockSearchParams = new URLSearchParams()
  })

  it('renders AuthScreen and return home button when unauthenticated', () => {
    render(<LoginPage />)

    expect(screen.getByTestId('auth-screen')).toBeInTheDocument()
    expect(screen.getByText('← กลับหน้าเว็บหลัก')).toBeInTheDocument()
  })

  it('renders temp account expired banner when expired searchParam is 1', () => {
    mockSearchParams = new URLSearchParams('expired=1')

    render(<LoginPage />)

    expect(screen.getByText('บัญชีผู้ทรงคุณวุฒิชั่วคราวหมดอายุแล้ว')).toBeInTheDocument()
    expect(screen.getByText(/สิทธิ์การเข้าใช้งานแบบชั่วคราวของคุณสิ้นสุดลงแล้ว/i)).toBeInTheDocument()
  })

  it('redirects to home when user is already authenticated and not expired', () => {
    mockUser = { id: 'u1' }

    render(<LoginPage />)

    expect(mockReplace).toHaveBeenCalledWith('/')
  })
})
