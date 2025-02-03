/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import { cn } from '@shared/cn'
import type { ColumnDef, RowData, Table as TTable } from '@tanstack/react-table'

import { useEffect, useMemo, useState, memo } from 'react'

import { DataTablePagination } from './data-table-pagination'

// needed for row & cell level scope DnD setup
import { DraggableTable } from './dnd-table'
import { StaticTable } from './static-table'
import { useDataTable } from './use-data-table'

declare module '@tanstack/react-table' {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'range' | 'select' | 'multi-select'
    editable?: boolean
  }
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbar?: (table: TTable<TData>) => React.ReactNode
  emptyState?: React.ReactNode
  pagination?: 'simple' | 'complex'
  draggable?: boolean
  classNames?: {
    container?: string
    table?: string
    tableHeader?: string
    tableHead?: string
    tableBody?: string
    tableRow?: string
    tableCell?: string
  }
}

type AccessorColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  accessorKey: string
}

export const DataTable = <TData, TValue>({
  columns,
  data,
  toolbar,
  classNames,
  emptyState,
  pagination,
  draggable
}: DataTableProps<TData, TValue>) => {
  const processedColumns: ColumnDef<TData, TValue>[] = useMemo(
    () =>
      columns.map((column) => {
        const id =
          column.id ||
          ('accessorKey' in column
            ? (column as unknown as AccessorColumnDef<TData, TValue>)
                .accessorKey
            : `col-${Math.random().toString(36).slice(2, 9)}`)
        const enhancedColumn: ColumnDef<TData, TValue> = {
          ...column,
          id,
          ...(column.meta?.filterVariant === 'multi-select' && {
            filterFn: (row, columnId, filterValue) => {
              return filterValue?.includes(row.getValue(columnId))
            }
          })
        }
        if (enhancedColumn.meta?.editable) {
          return {
            ...column,
            cell: ({ row, column, getValue, table }) => (
              <EditableCell
                getValue={getValue}
                rowIndex={row.index}
                columnId={column.id}
                table={table}
              />
            )
          }
        }
        return enhancedColumn
      }),
    [columns]
  )

  const { table, columnOrder, sensors, handleDragEnd } = useDataTable({
    columns: processedColumns,
    data
  })

  // memoize the classNames to prevent re-renders
  const memoizedClassNames = useMemo(() => classNames, [classNames])
  const emptyStateMemo = useMemo(() => emptyState, [emptyState])

  return (
    <div className='space-y-4'>
      {toolbar && toolbar(table)}
      <div className={cn(classNames?.container, 'rounded-md border')}>
        {draggable ? (
          <DraggableTable
            table={table}
            sensors={sensors}
            handleDragEnd={handleDragEnd}
            classNames={memoizedClassNames}
            columnOrder={columnOrder}
          />
        ) : (
          <StaticTable
            table={table}
            classNames={memoizedClassNames}
            columns={processedColumns}
            emptyState={emptyStateMemo}
          />
        )}
      </div>
      {pagination && <DataTablePagination table={table} type={pagination} />}
    </div>
  )
}

const EditableCell = <TData, TValue>({
  getValue,
  rowIndex,
  columnId,
  table
}: {
  getValue: () => TValue
  rowIndex: number
  columnId: string
  table: TTable<TData>
}) => {
  const initialValue = getValue()
  const [value, setValue] = useState(initialValue)

  const onBlur = () => {
    table.options.meta?.updateData(rowIndex, columnId, value)
  }

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return (
    <input
      value={value as string}
      onChange={(e) => setValue(e.target.value as unknown as TValue)}
      onBlur={onBlur}
      className='w-full bg-transparent'
    />
  )
}
