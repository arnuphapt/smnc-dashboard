import { render, screen, fireEvent } from '@testing-library/react'
import { MasterDataTable } from './MasterDataTable'

interface TestItem {
  id: string
  title: string
}

describe('MasterDataTable component', () => {
  const columns = [
    { key: 'title', header: 'Title', render: (item: TestItem) => item.title },
  ]
  const data = [
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' },
  ]

  it('renders title, badge, action button, and search input', () => {
    const onSearchChange = jest.fn()
    const onActionClick = jest.fn()

    render(
      <MasterDataTable
        badge="จัดการข้อมูล"
        title="รายการงานวิจัย"
        actionButton={{ label: 'เพิ่มข้อมูล', onClick: onActionClick }}
        searchValue=""
        onSearchChange={onSearchChange}
        columns={columns}
        data={data}
        getRowKey={(item) => item.id}
        empty={{ icon: <span />, title: 'ไม่มีข้อมูล' }}
      />
    )

    expect(screen.getByText('จัดการข้อมูล')).toBeInTheDocument()
    expect(screen.getByText('รายการงานวิจัย')).toBeInTheDocument()
    expect(screen.getByText('2 รายการ')).toBeInTheDocument()

    const actionBtn = screen.getByText('เพิ่มข้อมูล')
    fireEvent.click(actionBtn)
    expect(onActionClick).toHaveBeenCalledTimes(1)

    const searchInput = screen.getByPlaceholderText('ค้นหา...')
    fireEvent.change(searchInput, { target: { value: 'Item 1' } })
    expect(onSearchChange).toHaveBeenCalledWith('Item 1')
  })

  it('renders filter selects and handles filter selection', () => {
    const onFilterChange = jest.fn()
    const filters = [
      {
        key: 'type',
        label: 'ประเภท',
        value: 'type1',
        onChange: onFilterChange,
        options: [{ value: 'type1', label: 'ประเภท 1' }],
      },
    ]

    render(
      <MasterDataTable
        title="ตารางกรอง"
        searchValue=""
        onSearchChange={jest.fn()}
        filters={filters}
        columns={columns}
        data={data}
        getRowKey={(item) => item.id}
        empty={{ icon: <span />, title: 'ไม่มีข้อมูล' }}
      />
    )

    expect(screen.getAllByText(/ประเภท/)[0]).toBeInTheDocument()
  })

  it('renders loading state when loading is true', () => {
    render(
      <MasterDataTable
        title="ตารางโหลด"
        searchValue=""
        onSearchChange={jest.fn()}
        columns={columns}
        data={[]}
        getRowKey={(item) => item.id}
        loading={true}
        loadingLabel="กำลังโหลดข้อมูล..."
        empty={{ icon: <span />, title: 'ไม่มีข้อมูล' }}
      />
    )

    expect(screen.getAllByText('กำลังโหลดข้อมูล...')[0]).toBeInTheDocument()
  })
})
