'use client'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { Checkbox } from '@ui/checkbox'

interface Props<TData> {
	columns: ColumnDef<TData>[]
	rowAction?: (row: Row<TData>) => React.ReactNode
	withSelect?: boolean
}

export function withColumns<TData>({
	columns,
	rowAction,
	withSelect,
}: Props<TData>): Array<ColumnDef<TData>> {
	return [
		...(withSelect ? [selectionColumn<TData>()] : []),
		...columns,
		...(rowAction ? [actionColumn<TData>(rowAction)] : []),
	]
}

// Helper for selection column
const selectionColumn = <TData,>(): ColumnDef<TData> => ({
  id: 'select',
  header: ({ table }) => (
    <Checkbox
      className='ml-2'
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={value => row.toggleSelected(!!value)}
    />
  ),
});

// Helper for action column
const actionColumn = <TData,>(
  rowAction: (row: Row<TData>) => React.ReactNode
): ColumnDef<TData> => ({
  id: 'actions',
  cell: ({ row }) => rowAction(row),
});