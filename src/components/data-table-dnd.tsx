'use client'
import { useColumnOrderManagement, useDataTable } from '@/hooks/use-data-table'
import { cn } from '@/lib/utils'
import type { Cell, ColumnDef, Header, Row, Table } from '@tanstack/react-table'
import React, { Suspense, createContext, lazy, use } from 'react'
import type { DataTablePaginationProps } from './data-table-pagination'
import { StaticTable } from './data-table-static'
import {
	DataTableToolbar,
	type DataTableToolbarProps,
} from './data-table-toolbar'
import { withColumns } from './data-table-with-columns'

const LazyDataTablePagination = lazy(() => import('./data-table-pagination'))
const LazyDataTableToolbar = lazy(() => import('./data-table-toolbar'))
const LazyDraggableTable = lazy(() => import('./dnd-table'))

// Base interface that properly extends ColumnDef while handling the discriminated union
type DataTableColumnProps<TData> = Omit<
	ColumnDef<TData>,
	'cell' | 'header' | 'meta'
> & {
	header?: string | ((props: unknown) => React.ReactNode)
	filterHeader?: string
	filterVariant?: 'text' | 'multi-select' | 'range' | 'select'
	editable?: boolean
	children: (props: { row: Row<TData> }) => React.ReactNode
} & ( // Accessor key column
		| {
				accessorKey: string
				accessorFn?: never
				id?: never
		  }
		| {
				accessorKey?: never
				accessorFn: (row: TData) => unknown
				id: string
		  }
		| {
				accessorKey?: never
				accessorFn?: never
				id?: string
		  }
	)

interface DataTableProps<TData> {
	data: TData[]
	withSelect?: boolean
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
	devtools?: boolean
	onDataChange?: (data: TData, hasChange: boolean) => void
	children?: React.ReactNode
}

// Create a context that stores the actual data type
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
interface DataTableContextValue<TData = any> {
	table: Table<TData>
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const DataTableContext = createContext<DataTableContextValue<any> | null>(null)

// Helper function to create a typed DataTable with drag and drop support
export function createDataTableDnd<TData = unknown>() {
	// Create typed compound components
	const Column = (_: DataTableColumnProps<TData>): null => null

	const Action = (_: DataTableColumnProps<TData>): null => null

	const Toolbar = (props: Omit<DataTableToolbarProps<TData>, 'table'>) => {
		const context = use(DataTableContext) as DataTableContextValue<TData>
		if (!context) {
			throw new Error('DataTable.Toolbar must be used within a DataTable')
		}

		return (
			<Suspense fallback={<div>Loading...</div>}>
				{/* @ts-ignore */}
				<LazyDataTableToolbar table={context.table} {...props} />
			</Suspense>
		)
	}

	const Pagination = (
		props: Omit<DataTablePaginationProps<TData>, 'table'>,
	) => {
		const context = use(DataTableContext) as DataTableContextValue<TData>
		if (!context) {
			throw new Error('DataTable.Pagination must be used within a DataTable')
		}

		return (
			<Suspense fallback={<div>Loading...</div>}>
				{/* @ts-ignore */}
				<LazyDataTablePagination table={context.table} {...props} />
			</Suspense>
		)
	}

	const DataTableComponent = ({
		children,
		...props
	}: DataTableProps<TData>): React.ReactElement => {
		// Extract column children and action children separately
		const columnChildren = React.Children.toArray(children).filter(
			(child) => React.isValidElement(child) && child.type === Column,
		) as Array<React.ReactElement<DataTableColumnProps<TData>>>

		const actionChildren = React.Children.toArray(children).filter(
			(child) => React.isValidElement(child) && child.type === Action,
		) as Array<React.ReactElement<DataTableColumnProps<TData>>>

		// Convert column children to ColumnDef objects
		const columnsFromChildren = React.useMemo(() => {
			// Helper function to create column definition
			const createColumnDef = (
				child: React.ReactElement<DataTableColumnProps<TData>>,
				isAction = false,
			): ColumnDef<TData> => {
				const childProps = child.props as DataTableColumnProps<TData>

				// Validate conditional props (only for regular columns)
				if (!isAction) {
					if (childProps.accessorKey && childProps.accessorFn) {
						throw new Error(
							'Cannot use both accessorKey and accessorFn in the same column',
						)
					}

					if (childProps.accessorFn && !childProps.id) {
						throw new Error('id is required when using accessorFn')
					}
				}

				// Build base column definition
				const baseColumn = {
					cell: ({ row }: { row: Row<TData> }) => childProps.children({ row }),
					header: !isAction
						? childProps.header ||
							childProps.filterHeader ||
							childProps.accessorKey ||
							childProps.id
						: childProps.header,
					enableSorting: isAction ? false : childProps.enableSorting,
					enableHiding: childProps.enableHiding,
					enableColumnFilter: isAction ? false : undefined,
					size: childProps.size,
					maxSize: childProps.maxSize,
					minSize: childProps.minSize,
					meta: {
						editable: childProps.editable,
						filterHeader: childProps.filterHeader,
						filterVariant: childProps.filterVariant,
						action: isAction,
					},
				}

				// For action columns, return display column
				if (isAction) {
					return {
						...baseColumn,
						id: 'actions',
					} as ColumnDef<TData>
				}

				// Create column definition based on accessor type for regular columns
				if (childProps.accessorKey) {
					return {
						...baseColumn,
						accessorKey: childProps.accessorKey,
						id: childProps.accessorKey,
					} as ColumnDef<TData>
				}

				if (childProps.accessorFn && childProps.id) {
					return {
						...baseColumn,
						accessorFn: childProps.accessorFn,
						id: childProps.id,
					} as ColumnDef<TData>
				}

				// Display column (no accessor)
				return {
					...baseColumn,
					id: childProps.id || `col-${Math.random().toString(36).slice(2, 9)}`,
				} as ColumnDef<TData>
			}

			// Create regular columns
			const regularColumnDefs = columnChildren.map((child) =>
				createColumnDef(child, false),
			)

			// Create action column if it exists (only use the first one)
			const allColumns = [...regularColumnDefs]
			if (actionChildren.length > 0 && actionChildren[0]) {
				// Only use the first action component, ignore duplicates
				allColumns.push(createColumnDef(actionChildren[0], true))
			}

			return allColumns
		}, [columnChildren, actionChildren])

		// Memoize built columns to prevent unnecessary recalculations
		const buildedColumns = React.useMemo(
			() =>
				withColumns<TData>({
					columns: columnsFromChildren,
					withSelect: props.withSelect,
				}),
			[columnsFromChildren, props.withSelect],
		)

		// Check if pagination component is used
		const paginationChildren = React.Children.toArray(children).filter(
			(child) => React.isValidElement(child) && child.type === Pagination,
		)

		const hasPagination = paginationChildren.length > 0

		// Use optimized data table hook
		const { table, virtualizer, parentRef, state, handlers, metrics } =
			useDataTable({
				columns: buildedColumns,
				data: props.data,
				onDataChange: props.onDataChange,
				pagination: hasPagination
					? {
							enabled: true,
							pageSize: props.pagination?.pageSize,
						}
					: { enabled: false },
				virtualization: {
					enabled: true,
					estimateSize: 20,
					overscan: 20,
				},
				enableRowSelection: true,
				enableSorting: true,
				enableFiltering: true,
				enableColumnVisibility: true,
			})

		// Column order management for drag & drop
		const { columnOrder, handleDragEnd } = useColumnOrderManagement(
			state.columnOrder,
		)

		// Update column order when it changes from drag & drop
		React.useEffect(() => {
			if (props.draggable && columnOrder !== state.columnOrder) {
				handlers.updateColumnOrder(columnOrder)
			}
		}, [
			columnOrder,
			state.columnOrder,
			props.draggable,
			handlers.updateColumnOrder,
		])

		// Split children into their respective components
		const toolbarChildren = React.Children.toArray(children).filter(
			(child) => React.isValidElement(child) && child.type === Toolbar,
		)

		// Performance monitoring in development
		React.useEffect(() => {
			if (process.env.NODE_ENV === 'development' && props.devtools) {
				console.log('DataTable Performance Metrics:', metrics)
			}
		}, [metrics, props.devtools])

		return (
			<DataTableContext.Provider
				value={{ table } as DataTableContextValue<TData>}
			>
				<div className='space-y-4'>
					{toolbarChildren}

					<div
						className={cn(props.classNames?.container, 'rounded-md border')}
						ref={parentRef}
					>
						{props.draggable ? (
							<Suspense fallback={<div>Loading...</div>}>
								<LazyDraggableTableWrapper
									table={table}
									columnOrder={columnOrder}
									handleDragEnd={handleDragEnd}
									classNames={props.classNames}
									loading={props.loading}
								/>
							</Suspense>
						) : (
							<StaticTable
								table={table}
								columns={buildedColumns}
								emptyState={props.emptyState || <div>No data available</div>}
								loading={props.loading}
								virtualizer={virtualizer}
								classNames={props.classNames}
							/>
						)}
					</div>

					{paginationChildren}
				</div>
			</DataTableContext.Provider>
		)
	}

	// Attach compound components
	DataTableComponent.Column = Column
	DataTableComponent.Action = Action

	// Create a new Toolbar component with CreateComponent attached
	const ToolbarWithCreateComponent = Object.assign(Toolbar, {
		CreateComponent: DataTableToolbar.CreateComponent,
	})
	DataTableComponent.Toolbar = ToolbarWithCreateComponent
	DataTableComponent.Pagination = Pagination

	return DataTableComponent
}

function LazyDraggableTableWrapper<TData>(props: {
	table: Table<TData>
	columnOrder: string[]
	handleDragEnd: (activeId: string, overId: string) => void
	loading?: boolean
	classNames?: {
		container?: string
		table?: string
		tableHeader?: string
		tableHead?: (header: Header<TData, unknown>) => string
		tableBody?: string
		tableRow?: (row: Row<TData>) => string
		tableCell?: (cell: Cell<TData, unknown>) => string
	}
}) {
	// Type-safe props for the lazy component
	const draggableProps = {
		table: props.table as Table<unknown>, // Type assertion to work around lazy loading type loss
		columnOrder: props.columnOrder,
		handleDragEnd: props.handleDragEnd,
		loading: props.loading,
		classNames: props.classNames
			? {
					...props.classNames,
					tableHead: props.classNames.tableHead as
						| ((header: Header<unknown, unknown>) => string)
						| undefined,
					tableRow: props.classNames.tableRow as
						| ((row: Row<unknown>) => string)
						| undefined,
					tableCell: props.classNames.tableCell as
						| ((cell: Cell<unknown, unknown>) => string)
						| undefined,
				}
			: undefined,
	}

	return <LazyDraggableTable {...draggableProps} />
}

export type { DataTableColumnProps, DataTableProps }
