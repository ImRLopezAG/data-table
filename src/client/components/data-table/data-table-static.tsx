import type { Cell, Header, Row, Table as TTable } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
import { Table } from './components'

interface StaticTableProps<TData> {
	table: TTable<TData>
	emptyState: React.ReactNode
	loading?: boolean
	virtualizer: Virtualizer<HTMLDivElement, Element>

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
	emptyState,
	loading = false,
	classNames,
	virtualizer,
}: StaticTableProps<TData>) {
	return (
		<Table<TData> classNames={classNames} table={table}>
			<Table.Header<TData>>
				{(headerGroup) => (
					<Table.Row key={headerGroup.id}>
						{headerGroup.headers.map((header) => (
							<Table.Head key={header.id} header={header}>
								{header.isPlaceholder
									? null
									: flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
							</Table.Head>
						))}
					</Table.Row>
				)}
			</Table.Header>

			<Table.Body<TData>
				loading={loading}
				virtualizer={virtualizer}
				emptyState={emptyState}
			>
				{(row, virtualRow, index) => (
					<Table.Row<TData>
						key={row.id}
						row={row}
						style={{
							height: `${virtualRow.size}px`,
							transform: `translateY(${
								virtualRow.start - index * virtualRow.size
							}px)`,
						}}
					>
						{row.getVisibleCells().map((cell) => (
							<Table.Cell<TData> key={cell.id} cell={cell}>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</Table.Cell>
						))}
					</Table.Row>
				)}
			</Table.Body>
		</Table>
	)
}
