import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState component', () => {
  it('renders title and icon', () => {
    render(<EmptyState icon={<span data-testid="icon" />} title="ไม่พบข้อมูล" />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('ไม่พบข้อมูล')).toBeInTheDocument()
  })

  it('renders body when provided', () => {
    render(<EmptyState icon={<span />} title="ไม่พบข้อมูล" body="กรุณาลองค้นหาใหม่อีกครั้ง" />)
    expect(screen.getByText('กรุณาลองค้นหาใหม่อีกครั้ง')).toBeInTheDocument()
  })

  it('applies dashed style when dashed is true', () => {
    const { container } = render(<EmptyState icon={<span />} title="ไม่พบข้อมูล" dashed />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveStyle({ border: '2px dashed #CBD5E1' })
  })
})
