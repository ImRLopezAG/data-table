import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui/table'

import type { ColumnDef, Table as TTable } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'

interface StaticTableProps<TData> {
	table: TTable<TData>
	columns: ColumnDef<TData>[]
	emptyState: React.ReactNode
	classNames?: {
		table?: string
		tableRow?: string
		tableCell?: string
		tableBody?: string
	}
}
import { cn } from '@shared/cn'
export function StaticTable<TData>({
	table,
	columns,
	emptyState,
	classNames,
}: StaticTableProps<TData>) {
	return (
		<Table className={classNames?.table}>
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map((header) => {
							return (
								<TableHead
									key={header.id}
									className='[&:has([role=checkbox])]:pl-2'
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
							className={classNames?.tableRow}
						>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id} className={cn('p-2', classNames?.tableCell)}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))
				) : (
					<TableRow>
						<TableCell colSpan={columns.length} className='p-2 h-24 text-center'>
							{emptyState}
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
