'use client'
import { useDataTable } from '@hooks/use-data-table'
import { cn } from '@shared/cn'
import type {
	Cell,
	ColumnDef,
	Header,
	Row,
	Table as TTable,
} from '@tanstack/react-table'
import { ReactTableDevtools } from '@tanstack/react-table-devtools'
import { useMemo } from 'react'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'
import { DraggableTable } from './dnd-table'
import { StaticTable } from './static-table'
import { withColumns } from './with-columns'

interface DataTableProps<TData> {
	columns: {
		withSelect?: boolean
		columns: ColumnDef<TData>[]
		rowAction?: (row: Row<TData>) => React.ReactNode
	}
	data: TData[]
	toolbar?: {
		createComponent?: React.ReactNode
		filter: {
			placeholder?: string
			column: string
		}
		showViewOptions?: boolean
		filters?: Array<{
			column: string
			title?: string
			options: Array<{
				label: string
				value: string
				icon?: React.ComponentType<{ className?: string }>
			}>
		}>
		classNames?: {
			input?: string
			content?: string
		}
	}
	emptyState?: React.ReactNode
	pagination?: 'simple' | 'complex'
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
}
export function DataTable<TData>(props: DataTableProps<TData>) {
	const buildedColumns = useMemo(
		() => withColumns<TData>(props.columns),
		[props.columns],
	)

	const { table, columnOrder, handleChangeColumnOrder } = useDataTable({
		columns: buildedColumns,
		data: props.data,
		onDataChange: props.onDataChange,
	})

	const { toolbar, classNames, emptyState, pagination, draggable, devtools } =
		props

	return (
		<div className='space-y-4'>
			{toolbar && <DataTableToolbar table={table} {...toolbar} />}
			<div className={cn(classNames?.container, 'rounded-md border')}>
				{draggable && (
					<DraggableTable
						table={table}
						columnOrder={columnOrder}
						handleChangeColumnOrder={handleChangeColumnOrder}
						classNames={classNames}
					/>
				)}
				{!draggable && (
					<StaticTable
						table={table}
						classNames={classNames}
						columns={buildedColumns}
						emptyState={emptyState}
					/>
				)}
			</div>
			{pagination && <DataTablePagination table={table} type={pagination} />}
			{devtools && <ReactTableDevtools table={table} />}
		</div>
	)
}
