'use client'
import { useDataTable } from '@/hooks/use-data-table'
import { cn } from '@/lib/utils'
import type { Cell, ColumnDef, Header, Row, Table } from '@tanstack/react-table'
import React, { Suspense, createContext, lazy, use } from 'react'
import type { DataTablePaginationProps } from './data-table-pagination'
import { StaticTable } from './data-table-static'
import type { DataTableToolbarProps } from './data-table-toolbar'
import { withColumns } from './data-table-with-columns'
import type { DndTaleComponent } from './dnd-table'

const LazyDataTablePagination = lazy(() => import('./data-table-pagination'))
const LazyDataTableToolbar = lazy(() => import('./data-table-toolbar'))
const LazyDraggableTable = lazy(() => import('./dnd-table')) as DndTaleComponent

interface DataTableProps<TData> {
	data: TData[]
	columns: {
		withSelect?: boolean
		columns: ColumnDef<TData>[]
		rowAction?: (row: Row<TData>) => React.ReactNode
	}
	emptyState?: React.ReactNode
	draggable?: boolean
	loading?: boolean
	pagination?: {
		pageSize?: number
	}
	classNames?: {
		container?: string
		table?: string
		tableHeader?: string
		tableHead?: (header: Header<TData, unknown>) => string
		tableBody?: string
		tableRow?: (row: Row<TData>) => string
		tableCell?: (cell: Cell<TData, unknown>) => string
	}
	onDataChange?: (data: TData[], changes: TData) => void
	children?: React.ReactNode
}

type DataTableContextType<TData> = {
	table: Table<TData>
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const DataTableContext = createContext<DataTableContextType<any> | null>(null)

// data-table.tsx
export function DataTable<TData>({
	children,
	...props
}: DataTableProps<TData>) {
	const buildedColumns = React.useMemo(
		() => withColumns<TData>(props.columns),
		[props.columns],
	)

	// Split children into their respective components
	const toolbarChildren = React.Children.toArray(children).filter(
		(child) => React.isValidElement(child) && child.type === DataTable.Toolbar,
	)

	const paginationChildren = React.Children.toArray(children).filter(
		(child) =>
			React.isValidElement(child) && child.type === DataTable.Pagination,
	)

	const hasPagination = paginationChildren.length > 0

	const { table, columnOrder, handleChangeColumnOrder } = useDataTable({
		columns: buildedColumns,
		data: props.data,
		onDataChange: props.onDataChange,
		pagination: hasPagination
			? {
					enabled: true,
					pageSize: props.pagination?.pageSize,
				}
			: { enabled: false },
	})

	return (
		<DataTableContext.Provider value={{ table }}>
			<div className='space-y-4'>
				{toolbarChildren}

				<div className={cn(props.classNames?.container, 'rounded-md border')}>
					{props.draggable ? (
						<Suspense fallback={<div>Loading...</div>}>
							<LazyDraggableTable
								table={table as Table<TData>}
								columnOrder={columnOrder}
								handleChangeColumnOrder={handleChangeColumnOrder}
								classNames={props.classNames}
								loading={props.loading}
							/>
						</Suspense>
					) : (
						<StaticTable
							table={table}
							classNames={props.classNames}
							columns={buildedColumns}
							emptyState={props.emptyState}
							loading={props.loading}
						/>
					)}
				</div>

				{paginationChildren}
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
	props: Omit<DataTableToolbarProps<TData>, 'table'>,
) {
	const { table } = useDataTableContext()
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<LazyDataTableToolbar table={table} {...props} />
		</Suspense>
	)
}

// Pagination compound component
DataTable.Pagination = function DT_Pagination<TData>(
	props: Omit<DataTablePaginationProps<TData>, 'table'>,
) {
	const { table } = useDataTableContext()
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<LazyDataTablePagination table={table} {...props} />
		</Suspense>
	)
}
