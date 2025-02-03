import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@ui/table'

import type { ColumnDef, Table as TTable } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'

interface StaticTableProps<TData, TValue> {
  table: TTable<TData>
  columns: ColumnDef<TData, TValue>[]
  emptyState: React.ReactNode
  classNames?: {
    table?: string
    tableRow?: string
    tableCell?: string
    tableBody?: string
  }
}

export const StaticTable: <TData, TValue>({
  table,
  columns,
  emptyState,
  classNames
}: StaticTableProps<TData, TValue>) => JSX.Element = ({
  table,
  columns,
  emptyState,
  classNames
}) => (
  <Table className={classNames?.table}>
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            return (
              <TableHead
                key={header.id}
                className='[&:has([role=checkbox])]:pl-3'
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            )
          })}
        </TableRow>
      ))}
    </TableHeader>
    <TableBody className={classNames?.tableBody}>
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={row.getIsSelected() && 'selected'}
            className={classNames?.tableRow}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className={classNames?.tableCell}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columns.length} className='h-24 text-center'>
            {emptyState}
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
)
