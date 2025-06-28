import { Skeleton } from '@/client/components/ui/skeleton'

import {
	Table as BaseTable,
	TableBody as BaseTableBody,
	TableCell as BaseTableCell,
	TableHead as BaseTableHead,
	TableHeader as BaseTableHeader,
	TableRow as BaseTableRow,
} from '@/client/components/ui/table'
import { cn } from '@/lib/utils'
import type {
	Cell,
	Header,
	HeaderGroup,
	Row,
	Table as TTable,
} from '@tanstack/react-table'
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual'
import React from 'react'

// Base Table Component
interface TableProps<TableData = unknown>
	extends Omit<React.HTMLAttributes<HTMLTableElement>, 'children'> {
	children: React.ReactNode
	table: TTable<TableData>
	classNames?: {
		container?: string
		table?: string
		tableHeader?: string
		tableHead?: (header: Header<TableData, unknown>) => string
		tableBody?: string
		tableRow?: (row: Row<TableData>) => string
		tableCell?: (cell: Cell<TableData, unknown>) => string
	}
}

interface TableContextValue<TData> {
	table: TTable<TData>
	classNames?: {
		container?: string
		table?: string
		tableHeader?: string
		tableHead?: (header: Header<TData, unknown>) => string
		tableBody?: string
		tableRow?: (row: Row<TData>) => string
		tableCell?: (cell: Cell<TData, unknown>) => string
	}
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const TableContext = React.createContext<TableContextValue<any> | null>(null)

const useTableContext = <TData,>(): TableContextValue<TData> => {
	const context = React.useContext(TableContext)
	if (!context) {
		throw new Error('useTableContext must be used within a TableProvider')
	}
	return context
}

export function Table<TData>({
	table,
	children,
	className,
	classNames,
	...props
}: React.ComponentProps<typeof BaseTable> & TableProps<TData>) {
	const contextValue: TableContextValue<TData> = {
		classNames,
		table,
	}

	return (
		<TableContext.Provider value={contextValue}>
			<BaseTable
				className={cn(
					'w-full caption-bottom text-sm',
					'table-fixed', // Force fixed table layout for consistent column sizing
					classNames?.table,
					className,
				)}
				{...props}
			>
				{children}
			</BaseTable>
		</TableContext.Provider>
	)
}

// Table Header Component
interface TableHeaderProps<TData> {
	children: (headerGroups: HeaderGroup<TData>) => React.ReactNode
	className?: string
}

function TableHeader<TData>({
	children,
	className,
	...props
}: TableHeaderProps<TData> &
	Omit<
		React.HTMLAttributes<HTMLTableSectionElement>,
		'children' | 'className'
	>) {
	const { classNames, table } = useTableContext<TData>()

	return (
		<BaseTableHeader
			className={cn('sticky top-0 z-10', classNames?.tableHeader, className)}
			{...props}
		>
			{table.getHeaderGroups().map((headerGroup) => children(headerGroup))}
		</BaseTableHeader>
	)
}

// Table Body Component
interface TableBodyProps<TData> {
	children: (
		row: Row<TData>,
		virtualRow: VirtualItem,
		index: number,
	) => React.ReactNode
	loading?: boolean
	virtualizer: Virtualizer<HTMLDivElement, Element>
	emptyState?: React.ReactNode
	className?: string
}

function TableBody<TData>({
	children,
	className,
	loading,
	virtualizer,
	emptyState,
	...props
}: TableBodyProps<TData> &
	Omit<
		React.HTMLAttributes<HTMLTableSectionElement>,
		'children' | 'className'
	>) {
	const { classNames, table } = useTableContext<TData>()
	const rows = table.getRowModel().rows
	const columns = table.getAllColumns()

	return (
		<BaseTableBody className={cn(classNames?.tableBody, className)} {...props}>
			{loading ? (
				<Table.LoadingRows count={5} />
			) : virtualizer.getVirtualItems().length ? (
				virtualizer.getVirtualItems().map((virtualRow, index) => {
					const row = rows[virtualRow.index]
					if (!row) return null
					return children(row, virtualRow, index)
				})
			) : (
				<Table.EmptyState colSpan={columns.length}>
					{emptyState}
				</Table.EmptyState>
			)}
		</BaseTableBody>
	)
}

// Table Row Component
interface TableRowProps<TData>
	extends React.HTMLAttributes<HTMLTableRowElement> {
	children?: React.ReactNode
	row?: Row<TData>
}

function TableRow<TData>({
	children,
	row,
	className,
	...props
}: TableRowProps<TData> &
	Omit<React.HTMLAttributes<HTMLTableRowElement>, keyof TableRowProps<TData>>) {
	const { classNames } = useTableContext<TData>()

	return (
		<BaseTableRow
			className={cn(
				row && classNames?.tableRow ? classNames.tableRow(row) : '',
				className,
			)}
			data-state={row?.getIsSelected() && 'selected'}
			{...props}
		>
			{children}
		</BaseTableRow>
	)
}

// Table Head Component
interface TableHeadProps<TData>
	extends React.HTMLAttributes<HTMLTableCellElement> {
	children?: React.ReactNode
	header: Header<TData, unknown>
	colSpan?: number
	ref?: React.Ref<HTMLTableCellElement>
}

function TableHead<TData>({
	children,
	header,
	className,
	colSpan,
	ref,
	...props
}: TableHeadProps<TData>) {
	const { classNames } = useTableContext<TData>()

	// Apply column sizing from TanStack Table
	const columnSize = header.getSize()
	const style = {
		width: `${columnSize}px`, // 150 is default, use auto for default
		minWidth: `${columnSize}px`,
		maxWidth: `${columnSize}px`,
		...props.style,
	}

	return (
		<BaseTableHead
			ref={ref}
			style={style}
			className={cn(
				'px-0 [&:has([role=checkbox])]:pl-1',
				'overflow-hidden text-ellipsis whitespace-nowrap', // Prevent content from overflowing
				header && classNames?.tableHead ? classNames.tableHead(header) : '',
				className,
			)}
			colSpan={colSpan}
			{...props}
		>
			{children}
		</BaseTableHead>
	)
}

// Table Cell Component
interface TableCellProps<TData>
	extends React.HTMLAttributes<HTMLTableCellElement> {
	children?: React.ReactNode
	cell: Cell<TData, unknown>
	colSpan?: number
	ref?: React.Ref<HTMLTableCellElement>
}

function TableCell<TData>({
	children,
	cell,
	className,
	colSpan,
	ref,
	...props
}: TableCellProps<TData>) {
	const { classNames } = useTableContext<TData>()

	// Apply column sizing from TanStack Table
	const columnSize = cell.column.getSize()
	const style = {
		width: `${columnSize}px`, // 150 is default, use auto for default
		minWidth: `${columnSize}px`,
		maxWidth: `${columnSize}px`,
		...props.style,
	}

	return (
		<BaseTableCell
			ref={ref}
			style={style}
			className={cn(
				'px-1 py-0',
				'overflow-hidden text-ellipsis whitespace-nowrap', // Prevent content from overflowing
				cell && classNames?.tableCell ? classNames.tableCell(cell) : '',
				className,
			)}
			colSpan={colSpan}
			{...props}
		>
			{children}
		</BaseTableCell>
	)
}

// Loading Rows Component
interface LoadingRowsProps {
	count?: number
}

function LoadingRows<TData>({ count = 5 }: LoadingRowsProps) {
	const { table } = useTableContext<TData>()

	if (!table) return null

	return (
		<>
			{Array.from({ length: count }).map((_, index) => (
				<TableRow key={`skeleton-${index}`}>
					{table.getHeaderGroups()[0]?.headers.map((header) => (
						<BaseTableCell key={header.id} className='p-1 align-baseline'>
							<Skeleton className='h-4 w-full' />
						</BaseTableCell>
					))}
				</TableRow>
			))}
		</>
	)
}

// Empty State Component
interface EmptyStateProps {
	colSpan: number
	children?: React.ReactNode
}

function EmptyState({ colSpan, children }: EmptyStateProps) {
	return (
		<TableRow>
			<BaseTableCell colSpan={colSpan} className='h-24 p-1 text-center'>
				{children ?? 'No data available'}
			</BaseTableCell>
		</TableRow>
	)
}

// Attach sub-components to main Table component
Table.Header = TableHeader
Table.Body = TableBody
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell
Table.LoadingRows = LoadingRows
Table.EmptyState = EmptyState

export {
	EmptyState,
	LoadingRows,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
}
