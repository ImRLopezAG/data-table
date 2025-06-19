import { Checkbox } from '@/components/ui/checkbox'
import type { ColumnDef, Row, Table } from '@tanstack/react-table'
import React, { useEffect, useState } from 'react'
import { DataTableColumnHeader } from './data-table-column-header'
interface Props<TData> {
	columns: ColumnDef<TData>[]
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
			return {
				...enhancedColumn,
				cell: ({ row, column, getValue, table }) => (
					<EditableCell
						getValue={getValue}
						rowIndex={row.index}
						columnId={column.id}
						table={table}
					/>
				),
			}
		}
		return enhancedColumn
	})
}

function selectionColumn<TData>(): ColumnDef<TData> {
	return {
		id: 'select',
		maxSize: 10,
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
			return <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
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
