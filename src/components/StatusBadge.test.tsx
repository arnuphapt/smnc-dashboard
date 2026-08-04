import { render, screen } from '@testing-library/react'
import { StatusBadge, StatusIcon, isPendingStatus, resolveStatusConfig } from './StatusBadge'

describe('StatusBadge component', () => {
  describe('resolveStatusConfig', () => {
    it('resolves exact status mapping', () => {
      const config = resolveStatusConfig('pending')
      expect(config.tone).toBe('pending')
      expect(config.label).toBe('รอการยืนยัน')
    })

    it('resolves keyword matching for unknown status string containing keywords', () => {
      expect(resolveStatusConfig('อนุมัติเรียบร้อย').tone).toBe('success')
      expect(resolveStatusConfig('อยู่ระหว่างการพิจารณา').tone).toBe('reviewing')
      expect(resolveStatusConfig('รอแก้ไขเพิ่มเติม').tone).toBe('action_required')
      expect(resolveStatusConfig('ยกเลิกรายการ').tone).toBe('danger')
    })

    it('returns slate fallback for completely unknown status string', () => {
      const config = resolveStatusConfig('unknown_random_status')
      expect(config.tone).toBe('slate')
      expect(config.label).toBe('unknown_random_status')
    })
  })

  describe('isPendingStatus', () => {
    it('returns true for pending, submitted, reviewing, or action_required statuses', () => {
      expect(isPendingStatus('pending')).toBe(true)
      expect(isPendingStatus('ยื่นแล้ว')).toBe(true)
      expect(isPendingStatus('กำลังตรวจ')).toBe(true)
      expect(isPendingStatus('รอแก้ไข')).toBe(true)
    })

    it('returns false for approved/success/danger statuses', () => {
      expect(isPendingStatus('approved')).toBe(false)
      expect(isPendingStatus('rejected')).toBe(false)
    })
  })

  describe('StatusBadge component icons rendering', () => {
    const testStatuses = [
      'approved',
      'pending',
      'cancelled',
      'completed',
      'rejected',
      'admin',
      'expert',
      'teacher',
      'ได้รับการขึ้นทะเบียนแล้ว',
      'ได้เลขคำขอ',
      'ส่งออกจากวิทยาลัย',
      'กำลังตรวจ',
      'วรรณกรรม',
      'ลิขสิทธิ์',
      'อนุสิทธิบัตร',
      'สิทธิบัตร',
      'เครื่องหมายการค้า',
      'ผลิตภัณฑ์',
      'สิ่งประดิษฐ์',
      'ดำเนินการแล้ว',
      'กำลังดำเนินการ',
      'ไม่ได้ดำเนินการ',
      'ปฐมภูมิ',
      'ทุติยภูมิ',
      'กิจการนักศึกษา',
      'การเรียนการสอน',
      'บริการวิชาการ',
      'การวิจัย',
      'ระดับชาติ',
      'ระดับสถาบัน',
      'ระดับจังหวัด',
      'อื่นๆ',
      'รอแก้ไข',
      'custom_unmapped_status',
    ]

    testStatuses.forEach((status) => {
      it(`renders StatusBadge correctly for status: "${status}"`, () => {
        const { container } = render(<StatusBadge status={status} />)
        expect(container.firstChild).toBeInTheDocument()
      })
    })

    it('renders custom label when provided', () => {
      render(<StatusBadge status="approved" customLabel="ผ่านการอนุมัติ" />)
      expect(screen.getByText('ผ่านการอนุมัติ')).toBeInTheDocument()
    })

    it('renders md size without crashing', () => {
      render(<StatusBadge status="pending" size="md" />)
      expect(screen.getByText('รอการยืนยัน')).toBeInTheDocument()
    })
  })

  describe('StatusIcon component', () => {
    it('renders icon dot without crashing', () => {
      const { container } = render(<StatusIcon status="approved" />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })
})
