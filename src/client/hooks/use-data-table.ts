import {
	type ColumnDef,
	type ColumnFiltersState,
	type RowSelectionState,
	type SortingState,
	type VisibilityState,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import React from 'react'

declare module '@tanstack/react-table' {
	// biome-ignore lint/correctness/noUnusedVariables: <explanation>
	interface ColumnMeta<TData, TValue> {
		filterVariant?: 'text' | 'range' | 'select' | 'multi-select'
		editable?: boolean
		filterHeader?: string
	}
	// biome-ignore lint/correctness/noUnusedVariables: <explanation>
	interface TableMeta<TData> {
		updateData: (rowIndex: number, columnId: string, value: unknown) => void
	}
}

// Enhanced table state interface
interface TableState {
	sorting: SortingState
	columnFilters: ColumnFiltersState
	columnVisibility: VisibilityState
	rowSelection: RowSelectionState
	columnOrder: string[]
}

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	onDataChange?: (data: TData) => void
	pagination?: {
		enabled: boolean
		pageSize?: number
		manualPagination?: boolean
	}
	virtualization?: {
		enabled: boolean
		estimateSize?: number
		overscan?: number
	}
	enableRowSelection?: boolean
	enableSorting?: boolean
	enableFiltering?: boolean
	enableColumnVisibility?: boolean
}

export function useDataTable<TData, TValue>({
	columns,
	data,
	onDataChange,
	pagination,
	virtualization = { enabled: true, estimateSize: 10, overscan: 10 },
	enableRowSelection = true,
	enableSorting = true,
	enableFiltering = true,
	enableColumnVisibility = true,
}: DataTableProps<TData, TValue>) {
	// Calculate initial column order
	const initialColumnOrder = React.useMemo(
		() => columns.map((col) => col.id ?? crypto.randomUUID()),
		[columns],
	)

	// Initialize state with reducer for better performance
	const [state, dispatch] = React.useReducer(tableStateReducer, {
		sorting: [],
		columnFilters: [],
		columnVisibility: {},
		rowSelection: {},
		columnOrder: initialColumnOrder,
	})

	// Create table instance with memoized config
	const isPaginationEnabled = pagination?.enabled ?? false

	const table = useReactTable<TData>({
		data,
		columns,
		enableRowSelection,
		enableSorting,
		enableFilters: enableFiltering,
		enableHiding: enableColumnVisibility,
		manualPagination: isPaginationEnabled && pagination?.manualPagination,
		...(isPaginationEnabled && {
			initialState: {
				pagination: {
					pageSize: pagination?.pageSize ?? 20,
				},
			},
		}),
		state,
		meta: {
			updateData: React.useCallback(
				(rowIndex: number, columnId: string, value: unknown) => {
					if (onDataChange) {
						const oldValue = (data[rowIndex] as Record<string, unknown>)[
							columnId
						]
						if (oldValue === value) return
						const updatedData = [...data]
						const rowData = { ...updatedData[rowIndex] } as TData
						;(rowData as Record<string, unknown>)[columnId] = value
						updatedData[rowIndex] = rowData

						onDataChange(rowData)
					}
				},
				[data, onDataChange],
			),
		},
		onRowSelectionChange: React.useCallback(
			(updater: React.SetStateAction<RowSelectionState>) => {
				const newValue =
					typeof updater === 'function' ? updater(state.rowSelection) : updater
				dispatch({ type: 'SET_ROW_SELECTION', payload: newValue })
			},
			[state.rowSelection],
		),
		onSortingChange: React.useCallback(
			(updater: React.SetStateAction<SortingState>) => {
				const newValue =
					typeof updater === 'function' ? updater(state.sorting) : updater
				dispatch({ type: 'SET_SORTING', payload: newValue })
			},
			[state.sorting],
		),
		onColumnFiltersChange: React.useCallback(
			(updater: React.SetStateAction<ColumnFiltersState>) => {
				const newValue =
					typeof updater === 'function' ? updater(state.columnFilters) : updater
				dispatch({ type: 'SET_COLUMN_FILTERS', payload: newValue })
			},
			[state.columnFilters],
		),
		onColumnVisibilityChange: React.useCallback(
			(updater: React.SetStateAction<VisibilityState>) => {
				const newValue =
					typeof updater === 'function'
						? updater(state.columnVisibility)
						: updater
				dispatch({ type: 'SET_COLUMN_VISIBILITY', payload: newValue })
			},
			[state.columnVisibility],
		),
		onColumnOrderChange: React.useCallback(
			(updater: React.SetStateAction<string[]>) => {
				const newValue =
					typeof updater === 'function' ? updater(state.columnOrder) : updater
				dispatch({ type: 'SET_COLUMN_ORDER', payload: newValue })
			},
			[state.columnOrder],
		),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
		...(isPaginationEnabled && {
			getPaginationRowModel: getPaginationRowModel(),
		}),
		getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
		getFacetedRowModel: enableFiltering ? getFacetedRowModel() : undefined,
		getFacetedUniqueValues: enableFiltering
			? getFacetedUniqueValues()
			: undefined,
	})

	// Virtualization setup
	const parentRef = React.useRef<HTMLDivElement>(null)
	const virtualizer = useVirtualizer({
		count: table.getRowModel().rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => virtualization.estimateSize ?? 50,
		overscan: virtualization.overscan ?? 10,
		enabled: virtualization.enabled,
	})

	// Memoized handlers for common operations
	const handlers = React.useMemo(
		() => ({
			resetState: () => dispatch({ type: 'RESET_STATE' }),
			updateColumnOrder: (newOrder: string[]) =>
				dispatch({ type: 'SET_COLUMN_ORDER', payload: newOrder }),
			clearFilters: () => table.resetColumnFilters(),
			clearSorting: () => table.resetSorting(),
			toggleAllRowsSelected: () => table.toggleAllRowsSelected(),
		}),
		[table],
	)

	// Performance metrics (optional)
	const metrics = React.useMemo(
		() => ({
			totalRows: data.length,
			filteredRows: table.getFilteredRowModel().rows.length,
			selectedRows: table.getSelectedRowModel().rows.length,
			visibleColumns: table.getVisibleLeafColumns().length,
			totalColumns: table.getAllColumns().length,
		}),
		[table, data.length],
	)

	return {
		table,
		state,
		dispatch,
		virtualizer,
		parentRef,
		handlers,
		metrics,
		// Convenience getters
		isLoading: false, // Can be extended with loading state
		isEmpty: data.length === 0,
		hasSelection: Object.keys(state.rowSelection).length > 0,
		hasFilters: state.columnFilters.length > 0,
		hasSorting: state.sorting.length > 0,
	}
}

// Custom hook for column order management (for drag & drop)
export function useColumnOrderManagement(initialOrder: string[]) {
	const [columnOrder, setColumnOrder] = React.useState(initialOrder)

	const handleDragEnd = React.useCallback(
		(activeId: string, overId: string) => {
			setColumnOrder((prev) => {
				const oldIndex = prev.indexOf(activeId)
				const newIndex = prev.indexOf(overId)

				if (oldIndex === -1 || newIndex === -1) return prev

				const newOrder = [...prev]
				newOrder.splice(oldIndex, 1)
				newOrder.splice(newIndex, 0, activeId)
				return newOrder
			})
		},
		[],
	)

	const resetOrder = React.useCallback(() => {
		setColumnOrder(initialOrder)
	}, [initialOrder])

	return {
		columnOrder,
		setColumnOrder,
		handleDragEnd,
		resetOrder,
	}
}

// Table state actions
type TableStateAction =
	| { type: 'SET_SORTING'; payload: SortingState }
	| { type: 'SET_COLUMN_FILTERS'; payload: ColumnFiltersState }
	| { type: 'SET_COLUMN_VISIBILITY'; payload: VisibilityState }
	| { type: 'SET_ROW_SELECTION'; payload: RowSelectionState }
	| { type: 'SET_COLUMN_ORDER'; payload: string[] }
	| { type: 'RESET_STATE' }

// Table state reducer for better state management
function tableStateReducer(
	state: TableState,
	action: TableStateAction,
): TableState {
	switch (action.type) {
		case 'SET_SORTING':
			return { ...state, sorting: action.payload }
		case 'SET_COLUMN_FILTERS':
			return { ...state, columnFilters: action.payload }
		case 'SET_COLUMN_VISIBILITY':
			return { ...state, columnVisibility: action.payload }
		case 'SET_ROW_SELECTION':
			return { ...state, rowSelection: action.payload }
		case 'SET_COLUMN_ORDER':
			return { ...state, columnOrder: action.payload }
		case 'RESET_STATE':
			return {
				sorting: [],
				columnFilters: [],
				columnVisibility: {},
				rowSelection: {},
				columnOrder: [],
			}
		default:
			return state
	}
}
