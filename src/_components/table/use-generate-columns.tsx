'use client'
import type { ColumnDef, Row, Table } from '@tanstack/react-table'
import { Checkbox } from '@ui/checkbox'
import { useMemo } from 'react'

interface Props<T> {
  columns: ColumnDef<T>[]
  rowAction?: (row: Row<T>) => React.ReactNode
  withSelect?: boolean
}

export function useGenerateColumns<T>({
  columns,
  rowAction,
  withSelect
}: Props<T>): Array<ColumnDef<T>> {
  return useMemo(
    () => [
      ...(withSelect
        ? [
            {
              id: 'select-col',
              header: ({ table }: { table: Table<T> }) => (
                <Checkbox
                  className='ml-1'
                  checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                  }
                  onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                  }
                  aria-label='Select all'
                />
              ),
              cell: ({ row }: { row: Row<T> }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label='Select row'
                />
              ),
              enableSorting: false,
              enableHiding: false
            }
          ]
        : []),
      ...columns,
      ...(rowAction
        ? [
            {
              id: 'actions',
              cell: ({ row }: { row: Row<T> }) => rowAction?.(row)
            }
          ]
        : [])
    ],
    [columns, withSelect, rowAction]
  )
}
