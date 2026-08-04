import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog component', () => {
  it('renders title, description and confirm/cancel buttons', () => {
    const onConfirm = jest.fn()
    const onClose = jest.fn()

    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="ยืนยันการลบข้อมูล"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?"
        variant="danger"
      />
    )

    expect(screen.getByText('ยืนยันการลบข้อมูล')).toBeInTheDocument()
    expect(screen.getByText('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')).toBeInTheDocument()

    fireEvent.click(screen.getByText('ยืนยัน'))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('ยกเลิก'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders warning variant and loading state', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        title="แจ้งเตือน"
        description="ข้อความเตือน"
        variant="warning"
        loading={true}
      />
    )

    expect(screen.getByText('รอสักครู่...')).toBeInTheDocument()
  })

  it('renders alertOnly mode with single button', () => {
    const onClose = jest.fn()
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={jest.fn()}
        title="แจ้งเตือนเรื่องสำคัญ"
        description="รายละเอียดเรื่องสำคัญ"
        alertOnly={true}
      />
    )

    expect(screen.queryByText('ยกเลิก')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('ยืนยัน'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
