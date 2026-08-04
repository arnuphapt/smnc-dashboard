import { render, screen, fireEvent } from '@testing-library/react'
import { SidePanel, FieldLabel } from './SidePanel'

describe('SidePanel component', () => {
  it('renders panel with title, subtitle, content and footer', () => {
    const onClose = jest.fn()
    render(
      <SidePanel
        open={true}
        onClose={onClose}
        title="จัดการข้อมูล"
        subtitle="รายละเอียดรายการ"
        footer={<button>บันทึก</button>}
      >
        <div><FieldLabel>ชื่อผู้ใช้</FieldLabel><input /></div>
      </SidePanel>
    )

    expect(screen.getByText('จัดการข้อมูล')).toBeInTheDocument()
    expect(screen.getByText('รายละเอียดรายการ')).toBeInTheDocument()
    expect(screen.getByText('ชื่อผู้ใช้')).toBeInTheDocument()
    expect(screen.getByText('บันทึก')).toBeInTheDocument()
  })

  it('triggers onClose when close button clicked', () => {
    const onClose = jest.fn()
    render(
      <SidePanel open={true} onClose={onClose} title="Panel Title">
        <p>Child</p>
      </SidePanel>
    )

    const closeBtn = screen.getByRole('button')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not render content when open is false', () => {
    render(
      <SidePanel open={false} onClose={jest.fn()} title="Hidden Panel">
        <p>Hidden Content</p>
      </SidePanel>
    )
    expect(screen.queryByText('Hidden Panel')).not.toBeInTheDocument()
  })
})
