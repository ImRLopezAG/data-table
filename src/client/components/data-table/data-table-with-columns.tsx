import { Checkbox } from '@/client/components/ui/checkbox'
import type { ColumnDef, Row, Table } from '@tanstack/react-table'
import { EllipsisVerticalIcon } from 'lucide-react'
import React from 'react'
import { DataTableColumnHeader } from './data-table-column-header'
interface Props<TData> {
	columns: Array<ColumnDef<TData>>
	rowAction?: (row: Row<TData>) => React.ReactNode
	withSelect?: boolean
}

type AccessorColumnDef<TData> = ColumnDef<TData> & {
	accessorKey: string
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
	].map((column) => {
		const id =
			column.id ||
			('accessorKey' in column
				? (column as unknown as AccessorColumnDef<TData>).accessorKey
				: `col-${Math.random().toString(36).slice(2, 9)}`)
		const enhancedColumn: ColumnDef<TData> = {
			...column,
			id,
			// Apply column sizing properly
			// ...(column.size && {
			// 	size: column.size,
			// 	minSize: column.minSize || column.size,
			// 	maxSize: column.maxSize || column.size,
			// }),
			...(column.meta?.filterHeader && {
				header: ({ column: headerColumn }) => (
					<DataTableColumnHeader
						column={headerColumn}
						title={column.meta?.filterHeader ?? ''}
					/>
				),
			}),
			...(column.meta?.filterVariant === 'multi-select' && {
				filterFn: (row, columnId, filterValue: Array<string>) => {
					return filterValue.includes(row.getValue(columnId))
				},
			}),
			...(column.meta?.filterVariant === 'range' && {
				filterFn: (row, columnId, filterValue: Array<string>) => {
					const value = row.getValue(columnId)
					return rangeFilter(value, filterValue)
				},
			}),
		}
		if (enhancedColumn.meta?.editable) {
			// Store the original cell function for comparison
			const originalCell = column.cell

			return {
				...enhancedColumn,
				// For editable columns, override the cell to conditionally use EditableCell
				cell: (cellContext) => {
					const { row, column, getValue, table } = cellContext

					// If there's no original cell, use EditableCell
					if (!originalCell) {
						return (
							<EditableCell
								getValue={getValue}
								rowIndex={row.index}
								columnId={column.id}
								table={table}
							/>
						)
					}

					// Get the original value
					const originalValue = getValue()

					// Handle different types of cell definitions
					let originalResult: React.ReactNode
					if (typeof originalCell === 'function') {
						originalResult = originalCell(cellContext)
					} else {
						originalResult = originalCell
					}

					// Check if the original result is "simple" - just displaying the raw value
					// This handles cases where children just return row.original.fieldName
					const isSimpleValue =
						originalResult === originalValue ||
						originalResult === String(originalValue) ||
						originalResult === Number(originalValue) ||
						// Check if it's a React element wrapping just the value
						(React.isValidElement(originalResult) &&
							(
								originalResult as React.ReactElement<{
									children?: React.ReactNode
								}>
							).props?.children === originalValue)

					if (isSimpleValue) {
						return (
							<EditableCell
								getValue={getValue}
								rowIndex={row.index}
								columnId={column.id}
								table={table}
							/>
						)
					}

					// Otherwise, use the custom cell content (complex rendering)
					return originalResult
				},
			}
		}
		return enhancedColumn
	})
}

function selectionColumn<TData>(): ColumnDef<TData> {
	return {
		id: 'select',
		size: 5,
		header: ({ table }) => {
			const checked = table.getIsAllPageRowsSelected()
			const onCheckedChange = React.useCallback(
				(value: boolean) => table.toggleAllPageRowsSelected(!!value),
				[table],
			)
			return (
				<Checkbox
					aria-label='Select all'
					checked={checked}
					className='size-4'
					onCheckedChange={onCheckedChange}
				/>
			)
		},
		cell: ({ row }) => {
			const checked = row.getIsSelected()
			const onCheckedChange = React.useCallback(
				(value: boolean) => row.toggleSelected(!!value),
				[row],
			)
			return <Checkbox checked={checked} onCheckedChange={onCheckedChange} className='min-size-6' />
		},
	}
}

// Helper for action column
const actionColumn = <TData,>(
	rowAction: (row: Row<TData>) => React.ReactNode,
): ColumnDef<TData> => ({
	id: 'actions',
	cell: ({ row }) => rowAction(row),
})

interface EditableCellProps<TData, TValue> {
	getValue: () => TValue
	rowIndex: number
	columnId: string
	table: Table<TData>
}

const EditableCell = <TData, TValue>({
	getValue,
	rowIndex,
	columnId,
	table,
}: EditableCellProps<TData, TValue>) => {
	const initialValue = getValue()
	const [value, setValue] = React.useState(initialValue)

	const onBlur = () => {
		table.options.meta?.updateData(rowIndex, columnId, value)
	}

	return (
		<div className='flex h-full w-full items-center justify-start'>
			<input
				type='text'
				value={value as string}
				onChange={(e) => setValue(e.target.value as unknown as TValue)}
				onBlur={onBlur}
				className='*: h-fit w-full text-ellipsis border-none bg-none bg-transparent px-0 py-0.5 shadow-none focus:border-0 focus:border-none focus:outline-none focus-visible:border-0 focus-visible:ring-0'
			/>
			<EllipsisVerticalIcon className='size-4 text-gray-500' />
		</div>
	)
}

export function rangeFilter(value: unknown, filterValue: Array<string>) {
	const parsedValue = parseValue(value)
	const cleanedFilterValue = filterValue.map((v) => v.trim())
	return cleanedFilterValue.some((range) => {
		if (parsedValue instanceof Date) {
			return dateFilterEvaluation(range, parsedValue)
		}

		const [minPart, maxPart] = range.split(/(?:-|to|,)/).map((p) => p.trim())

		if (typeof parsedValue === 'number') {
			const min = Number(minPart)
			const max = Number(maxPart)
			return (
				!Number.isNaN(min) &&
				!Number.isNaN(max) &&
				parsedValue >= min &&
				parsedValue <= max
			)
		}

		if (typeof value === 'string') {
			const minNum = Number(minPart)
			const maxNum = Number(maxPart)
			if (!Number.isNaN(minNum) && !Number.isNaN(maxNum)) {
				return value.length >= minNum && value.length <= maxNum
			}

			return (
				value.localeCompare(minPart ?? '') >= 0 &&
				value.localeCompare(maxPart ?? '') <= 0
			)
		}

		return false
	})
}

export function dateFilterEvaluation(cleaned: string, value: Date) {
	const dateRangeMatch = cleaned.match(
		/^([\d]{4}[-/]\d{2}[-/]\d{2})\s*(?:to|\/|,|–|-)\s*([\d]{4}[-/]\d{2}[-/]\d{2})$/i,
	)
	if (dateRangeMatch && dateRangeMatch.length === 3) {
		const [_, rawMin, rawMax] = dateRangeMatch
		if (!rawMin || !rawMax) {
			return false
		}
		const minDate = new Date(rawMin.trim())
		const maxDate = new Date(rawMax.trim())
		const evaluation =
			!Number.isNaN(minDate.getTime()) &&
			!Number.isNaN(maxDate.getTime()) &&
			!Number.isNaN(value.getTime())
		if (evaluation) {
			const APPLY_TO_FILTER = value >= minDate && value <= maxDate
			return APPLY_TO_FILTER
		}
	}
	return false
}

export function parseValue(value: unknown) {
	switch (typeof value) {
		case 'number':
			return value
		case 'string': {
			const date = new Date(value)
			if (!Number.isNaN(date.getTime())) {
				return date
			}
			const numberValue = Number(value)
			if (!Number.isNaN(numberValue)) {
				return numberValue
			}
			return value
		}
		default:
			return String(value)
	}
}
