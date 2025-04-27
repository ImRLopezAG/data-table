import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

import { cn } from '@/lib/utils'
import type {
	Cell,
	ColumnDef,
	Header,
	Row,
	Table as TTable,
} from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'

interface StaticTableProps<TData> {
	table: TTable<TData>
	columns: ColumnDef<TData>[]
	emptyState: React.ReactNode
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
export function StaticTable<TData>({
	table,
	columns,
	emptyState,
	classNames,
}: StaticTableProps<TData>) {
	return (
		<Table className={classNames?.table}>
			<TableHeader className={classNames?.tableHeader}>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map((header) => {
							return (
								<TableHead
									key={header.id}
									className={cn(
										'[&:has([role=checkbox])]:pl-1',
										classNames?.tableHead ? classNames.tableHead(header) : '',
									)}
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
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
							className={cn(
								classNames?.tableRow ? classNames.tableRow(row) : '',
							)}
						>
							{row.getVisibleCells().map((cell) => (
								<TableCell
									key={cell.id}
									className={cn(
										'p-1 align-baseline',
										classNames?.tableCell ? classNames.tableCell(cell) : '',
									)}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))
				) : (
					<TableRow>
						<TableCell
							colSpan={columns.length}
							className='h-24 p-1 text-center'
						>
							{emptyState}
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
