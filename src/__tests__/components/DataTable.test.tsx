import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable, DataTableColumn } from '@/components/DataTable'

interface Row {
  id: string
  name: string
}

const columns: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true, render: (row) => row.name },
]

const makeRows = (count: number): Row[] =>
  Array.from({ length: count }, (_, i) => ({ id: String(i + 1), name: `Row ${i + 1}` }))

describe('DataTable component', () => {
  it('shows empty state when data is empty', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        getRowKey={(row) => row.id}
        empty={{ icon: <span />, title: 'ไม่พบข้อมูล' }}
      />
    )
    expect(screen.getAllByText('ไม่พบข้อมูล')[0]).toBeInTheDocument()
  })

  it('renders loading state when loading is true', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        getRowKey={(row) => row.id}
        loading={true}
        loadingLabel="กำลังโหลดข้อมูล..."
        empty={{ icon: <span />, title: 'ไม่พบข้อมูล' }}
      />
    )
    expect(screen.getAllByText('กำลังโหลดข้อมูล...')[0]).toBeInTheDocument()
  })

  it('renders summary cards, tabs, filters, eyebrow, title, search input and sortable header', () => {
    const onTabChange = jest.fn()
    const onSearchChange = jest.fn()
    const onFilterChange = jest.fn()

    const filters = [
      {
        key: 'cat',
        label: 'หมวดหมู่',
        value: '',
        onChange: onFilterChange,
        options: [{ value: 'opt1', label: 'ตัวเลือก 1' }],
      },
    ]

    render(
      <DataTable
        summaryCards={[{ key: 'c1', count: 10, label: 'รายการรวม' }]}
        tabs={[{ id: 'all', label: 'ทั้งหมด', count: 10 }]}
        activeTab="all"
        onTabChange={onTabChange}
        filters={filters}
        eyebrow="หมวดหมู่"
        title="ตารางข้อมูล"
        searchPlaceholder="ค้นหาคำ..."
        searchValue=""
        onSearchChange={onSearchChange}
        columns={columns}
        data={makeRows(5)}
        getRowKey={(row) => row.id}
        empty={{ icon: <span />, title: 'ไม่พบข้อมูล' }}
      />
    )

    expect(screen.getByText('รายการรวม')).toBeInTheDocument()
    expect(screen.getByText('หมวดหมู่')).toBeInTheDocument()
    expect(screen.getByText('ตารางข้อมูล')).toBeInTheDocument()

    const tabBtn = screen.getAllByText(/ทั้งหมด/)[0].closest('button')!
    fireEvent.click(tabBtn)
    expect(onTabChange).toHaveBeenCalledWith('all')

    const searchInput = screen.getByPlaceholderText('ค้นหาคำ...')
    fireEvent.change(searchInput, { target: { value: 'Row 1' } })
    expect(onSearchChange).toHaveBeenCalledWith('Row 1')

    // Click sortable header to toggle sort direction
    const sortHeader = screen.getAllByText('Name')[0]
    fireEvent.click(sortHeader)
    fireEvent.click(sortHeader)
  })

  it('paginates forward and backward when data has more than 10 items', () => {
    render(
      <DataTable
        columns={columns}
        data={makeRows(25)}
        getRowKey={(row) => row.id}
        empty={{ icon: <span />, title: 'ไม่พบข้อมูล' }}
      />
    )

    expect(screen.getAllByText('Row 1')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Row 10')[0]).toBeInTheDocument()

    const nextPageBtn = screen.getAllByRole('button', { name: 'หน้าถัดไป' })[0]
    fireEvent.click(nextPageBtn)
    expect(screen.getAllByText('Row 11')[0]).toBeInTheDocument()

    const prevPageBtn = screen.getAllByRole('button', { name: 'หน้าก่อนหน้า' })[0]
    fireEvent.click(prevPageBtn)
    expect(screen.getAllByText('Row 1')[0]).toBeInTheDocument()
  })

  it('resets page to 1 when resetKey changes', () => {
    const { rerender } = render(
      <DataTable
        columns={columns}
        data={makeRows(25)}
        getRowKey={(row) => row.id}
        empty={{ icon: <span />, title: 'ไม่พบข้อมูล' }}
        resetKey="key1"
      />
    )

    const nextPageBtn = screen.getAllByRole('button', { name: 'หน้าถัดไป' })[0]
    fireEvent.click(nextPageBtn)
    expect(screen.getAllByText('หน้า 2 / 3')[0]).toBeInTheDocument()

    rerender(
      <DataTable
        columns={columns}
        data={makeRows(25)}
        getRowKey={(row) => row.id}
        empty={{ icon: <span />, title: 'ไม่พบข้อมูล' }}
        resetKey="key2"
      />
    )
    expect(screen.getAllByText('หน้า 1 / 3')[0]).toBeInTheDocument()
  })
})
