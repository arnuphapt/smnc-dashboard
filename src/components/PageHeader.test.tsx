import { render, screen, fireEvent } from '@testing-library/react'
import { PageHeader, ContentPanel, SectionHeader } from './PageHeader'

describe('PageHeader components', () => {
  describe('PageHeader', () => {
    it('renders title, subtitle, and extraBadge in standard mode', () => {
      render(
        <PageHeader
          title="หน้าแรก"
          subtitle="คำอธิบายระบบ"
          extraBadge="ระบบหลัก"
          action={<button>Action</button>}
        />
      )
      expect(screen.getByText('หน้าแรก')).toBeInTheDocument()
      expect(screen.getByText('คำอธิบายระบบ')).toBeInTheDocument()
      expect(screen.getByText('SMNC · ระบบหลัก')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
    })

    it('renders in compact mode', () => {
      render(<PageHeader title="Compact Title" subtitle="Compact Subtitle" compact />)
      expect(screen.getByText('Compact Title')).toBeInTheDocument()
      expect(screen.getByText('Compact Subtitle')).toBeInTheDocument()
    })

    it('renders tabs and handles tab change click', () => {
      const onTabChange = jest.fn()
      const tabs = [
        { key: 'tab1', label: 'Tab One', badge: 5 },
        { key: 'divider-1', divider: true },
        { key: 'tab2', label: 'Tab Two', to: '/link-path' },
      ]

      render(
        <PageHeader
          title="Title"
          subtitle="Subtitle"
          tabs={tabs}
          activeTab="tab1"
          onTabChange={onTabChange}
        />
      )

      expect(screen.getByText('Tab One')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()

      const tabOneBtn = screen.getByText('Tab One').closest('button')!
      fireEvent.click(tabOneBtn)
      expect(onTabChange).toHaveBeenCalledWith('tab1')

      const tabTwoLink = screen.getByText('Tab Two').closest('a')!
      expect(tabTwoLink).toHaveAttribute('href', '/link-path')
    })
  })

  describe('ContentPanel', () => {
    it('renders children with card styling', () => {
      render(<ContentPanel className="custom-class">Content</ContentPanel>)
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('SectionHeader', () => {
    it('renders eyebrow, title, and subtitle', () => {
      render(<SectionHeader eyebrow="หมวดหมู่" title="หัวข้อหลัก" subtitle="คำอธิบายหัวข้อ" />)
      expect(screen.getByText('หมวดหมู่')).toBeInTheDocument()
      expect(screen.getByText('หัวข้อหลัก')).toBeInTheDocument()
      expect(screen.getByText('คำอธิบายหัวข้อ')).toBeInTheDocument()
    })
  })
})
