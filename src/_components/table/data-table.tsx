// data-table.tsx
'use client'
import { useDataTable } from './use-data-table'
import { cn } from '@shared/cn'
import type { Cell, ColumnDef, Header, Row, Table } from '@tanstack/react-table'
import { ReactTableDevtools } from '@tanstack/react-table-devtools'
import React, { createContext, use } from 'react'
import { DataTablePagination, type DataTablePaginationProps } from './data-table-pagination'
import { DataTableToolbar, type DataTableToolbarProps } from './data-table-toolbar'
import { DraggableTable } from './dnd-table'
import { StaticTable } from './static-table'
import { withColumns } from './with-columns'

interface DataTableProps<TData> {
  data: TData[]
  columns: {
    withSelect?: boolean
    columns: ColumnDef<TData>[]
    rowAction?: (row: Row<TData>) => React.ReactNode
  }
  emptyState?: React.ReactNode
  draggable?: boolean
  classNames?: {
    container?: string
    table?: string
    tableHeader?: string
    tableHead?: (header: Header<TData, unknown>) => string
    tableBody?: string
    tableRow?: (row: Row<TData>) => string
    tableCell?: (cell: Cell<TData, unknown>) => string
  }
  devtools?: boolean
  onDataChange?: (data: TData[], changes: TData) => void
  children?: React.ReactNode
}

type DataTableContextType<TData> = {
  table: Table<TData>
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const DataTableContext = createContext<DataTableContextType<any> | null>(null)

// data-table.tsx
export function DataTable<TData>({ children, ...props }: DataTableProps<TData>) {
  const buildedColumns = React.useMemo(
    () => withColumns<TData>(props.columns),
    [props.columns]
  )

  const { table, columnOrder, handleChangeColumnOrder } = useDataTable({
    columns: buildedColumns,
    data: props.data,
    onDataChange: props.onDataChange,
  })

  // Split children into their respective components
  const toolbarChildren = React.Children.toArray(children).filter(child =>
    React.isValidElement(child) && child.type === DataTable.Toolbar
  )
  
  const paginationChildren = React.Children.toArray(children).filter(child =>
    React.isValidElement(child) && child.type === DataTable.Pagination
  )

  return (
    <DataTableContext.Provider value={{ table }}>
      <div className='space-y-4'>
        {/* Render Toolbar first */}
        {toolbarChildren}
        
        {/* Table container */}
        <div className={cn(props.classNames?.container, 'rounded-md border')}>
          {props.draggable ? (
            <DraggableTable
              table={table}
              columnOrder={columnOrder}
              handleChangeColumnOrder={handleChangeColumnOrder}
              classNames={props.classNames}
            />
          ) : (
            <StaticTable
              table={table}
              classNames={props.classNames}
              columns={buildedColumns}
              emptyState={props.emptyState}
            />
          )}
        </div>

        {/* Render Pagination after table */}
        {paginationChildren}

        {props.devtools && <ReactTableDevtools table={table} />}
      </div>
    </DataTableContext.Provider>
  )
}
// Helper hook to access context
function useDataTableContext() {
  const context = use(DataTableContext)
  if (!context) {
    throw new Error('useDataTableContext must be used within a DataTable')
  }
  return context
}

// Toolbar compound component
DataTable.Toolbar = function DT_Toolbar<TData>(
  props: Omit<DataTableToolbarProps<TData>, 'table'>
) {
  const { table } = useDataTableContext()
  return <DataTableToolbar table={table} {...props} />
}

// Pagination compound component
DataTable.Pagination = function DT_Pagination<TData>(
  props: Omit<DataTablePaginationProps<TData>, 'table'>
) {
  const { table } = useDataTableContext()
  return <DataTablePagination table={table} {...props} />
}