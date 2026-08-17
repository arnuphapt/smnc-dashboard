import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { usePathname } from 'next/navigation'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.Mock

describe('Breadcrumbs component', () => {
  it('returns null on root path /', () => {
    mockUsePathname.mockReturnValue('/')
    const { container } = render(<Breadcrumbs />)
    expect(container.firstChild).toBeNull()
  })

  it('renders breadcrumbs for /clinic sub-page', () => {
    mockUsePathname.mockReturnValue('/clinic')
    render(<Breadcrumbs />)

    expect(screen.getByText('หน้าแรก')).toBeInTheDocument()
    expect(screen.getByText('คลินิกวิจัย')).toBeInTheDocument()
  })

  it('renders translated thai labels for nested path /repositories/research', () => {
    mockUsePathname.mockReturnValue('/repositories/research')
    render(<Breadcrumbs />)

    expect(screen.getByText('หน้าแรก')).toBeInTheDocument()
    expect(screen.getByText('คลังปัญญา 5 ด้าน')).toBeInTheDocument()
    expect(screen.getByText('คลังผลงานวิจัย')).toBeInTheDocument()
  })

  it('formats unmapped path segment correctly', () => {
    mockUsePathname.mockReturnValue('/custom-page-name')
    render(<Breadcrumbs />)

    expect(screen.getByText('Custom Page Name')).toBeInTheDocument()
  })
})
