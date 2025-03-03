import {
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  useGenerateColumns
} from '@components/table'
import { Commit, fakeCommits } from '@services/commit'
import { Checkbox } from '@ui/checkbox'
import { useState } from 'react'
export const App = () => {
  const [draggable, setDraggable] = useState(false)
  const toggleDraggable = () => setDraggable((prev) => !prev)
  return (
    <section className='p-4'>
      <div className='flex items-baseline gap-4'>
        <h1 className='text-2xl font-bold'>Commits</h1>
        <Checkbox
          checked={draggable}
          onCheckedChange={toggleDraggable}
          className='mt-2'
        />
      </div>
      <DataTable
        draggable={draggable}
        pagination='complex'
        data={fakeCommits(1_000)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            filter={{ column: 'message' }}
            filters={[
              {
                column: 'status',
                title: 'Status',
                options: [
                  { label: 'Pending', value: 'pending' },
                  { label: 'Success', value: 'success' },
                  { label: 'Failed', value: 'failed' }
                ]
              }
            ]}
          />
        )}
        columns={useGenerateColumns<Commit>({
          withSelect: true,
          columns: [
            {
              accessorKey: 'hash',
              header: 'Hash',
              cell: ({ row }) => row.original.hash.slice(0, 7)
            },
            {
              accessorKey: 'message',
              header: ({ column }) => (
                <DataTableColumnHeader column={column} title='Message' />
              ),
              cell: ({ row }) => row.original.message,
              meta: {
                editable: true
              }
            },
            {
              accessorKey: 'author',
              header: ({ column }) => (
                <DataTableColumnHeader column={column} title='Author' />
              ),
              cell: ({ row }) => row.original.author
            },
            {
              accessorKey: 'date',
              header: ({ column }) => (
                <DataTableColumnHeader column={column} title='Date' />
              ),
              cell: ({ row }) => row.original.date
            },
            {
              accessorKey: 'status',
              header: 'Status',
              cell: ({ row }) => row.original.status,
              meta: {
                filterVariant: 'multi-select'
              }
            }
          ]
        })}
      />
    </section>
  )
}
