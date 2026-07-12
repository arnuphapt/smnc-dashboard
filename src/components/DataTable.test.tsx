import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { DataTable, DataTableColumn } from './DataTable'

interface Row {
  id: string
  name: string
}

const columns: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', render: (row) => row.name },
]

const makeRows = (count: number): Row[] =>
  Array.from({ length: count }, (_, i) => ({ id: String(i + 1), name: `Row ${i + 1}` }))

describe('DataTable', () => {
  it('shows the empty state when there is no data', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        getRowKey={(row) => row.id}
        empty={{ icon: <span />, title: 'Nothing here' }}
      />
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('does not paginate when there are 10 or fewer rows', () => {
    render(
      <DataTable
        columns={columns}
        data={makeRows(10)}
        getRowKey={(row) => row.id}
        empty={{ icon: <span />, title: 'Nothing here' }}
      />
    )
    expect(screen.getByText('Row 10')).toBeInTheDocument()
    expect(screen.queryByText(/หน้า/)).not.toBeInTheDocument()
  })

  it('paginates at 10 rows per page once data exceeds the page size', async () => {
    render(
      <DataTable
        columns={columns}
        data={makeRows(25)}
        getRowKey={(row) => row.id}
        empty={{ icon: <span />, title: 'Nothing here' }}
      />
    )
    const user = userEvent.setup()

    expect(screen.getByText('Row 1')).toBeInTheDocument()
    expect(screen.getByText('Row 10')).toBeInTheDocument()
    expect(screen.queryByText('Row 11')).not.toBeInTheDocument()
    expect(screen.getByText('หน้า 1 / 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'หน้าถัดไป' }))
    expect(await screen.findByText('Row 11')).toBeInTheDocument()
    expect(screen.getByText('หน้า 2 / 3')).toBeInTheDocument()
  })

  it('resets to page 1 when resetKey changes', () => {
    const { rerender } = render(
      <DataTable
        columns={columns}
        data={makeRows(25)}
        getRowKey={(row) => row.id}
        empty={{ icon: <span />, title: 'Nothing here' }}
        resetKey="a"
      />
    )
    expect(screen.getByText('หน้า 1 / 3')).toBeInTheDocument()

    rerender(
      <DataTable
        columns={columns}
        data={makeRows(25)}
        getRowKey={(row) => row.id}
        empty={{ icon: <span />, title: 'Nothing here' }}
        resetKey="b"
      />
    )
    expect(screen.getByText('หน้า 1 / 3')).toBeInTheDocument()
  })
})
