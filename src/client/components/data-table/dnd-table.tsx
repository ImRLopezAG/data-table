'use client'

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
	arrayMove,
	horizontalListSortingStrategy,
	SortableContext,
	useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Cell, Header, Row, Table as TTable } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
import type { CSSProperties } from 'react'
import React from 'react'
import { cn } from '@/lib/utils'
import { Table } from './components'

export interface DraggableTableProps<TData> {
	table: TTable<TData>
	columnOrder: string[]
	handleColumnOrderChange: (newOrder: string[]) => void
	loading?: boolean
	virtualizer: Virtualizer<HTMLDivElement, Element>
	emptyState?: React.ReactNode
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

export function DraggableTable<TData>({
	table,
	columnOrder,
	classNames,
	handleColumnOrderChange,
	loading = false,
	virtualizer,
	emptyState,
}: DraggableTableProps<TData>) {
	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 1,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 250,
				tolerance: 5,
			},
		}),
		useSensor(KeyboardSensor),
	)

	const onHandleDragEnd = React.useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event
			if (active && over && active.id !== over.id) {
				const oldIndex = columnOrder.indexOf(active.id as string)
				const newIndex = columnOrder.indexOf(over.id as string)
				handleColumnOrderChange(arrayMove(columnOrder, oldIndex, newIndex))
			}
		},
		[handleColumnOrderChange],
	)

	const draggableColumns = React.useMemo(
		() => columnOrder.filter((id) => id !== 'select'),
		[columnOrder],
	)
	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToHorizontalAxis]}
			onDragEnd={onHandleDragEnd}
		>
			<Table<TData> classNames={classNames} table={table}>
				<Table.Header<TData>>
					{(headerGroup) => (
						<Table.Row key={headerGroup.id}>
							<SortableContext
								items={draggableColumns}
								strategy={horizontalListSortingStrategy}
							>
								{columnOrder.map((columnId) => {
									const header = headerGroup.headers.find(
										(h) => h.column.id === columnId,
									)
									if (!header) return null

									return (
										<DraggableTableHeader
											header={header}
											key={header.id}
											className={
												classNames?.tableHead
													? classNames.tableHead(header)
													: ''
											}
										/>
									)
								})}
							</SortableContext>
						</Table.Row>
					)}
				</Table.Header>
				<Table.Body<TData>
					virtualizer={virtualizer}
					loading={loading}
					emptyState={emptyState}
				>
					{(row, virtualRow, index) => {
						return (
							<Table.Row
								key={row.id}
								row={row}
								style={{
									height: `${virtualRow.size}px`,
									transform: `translateY(${virtualRow.start - index * virtualRow.size}px)`,
								}}
								className={classNames?.tableRow ? classNames.tableRow(row) : ''}
							>
								{' '}
								<SortableContext
									items={draggableColumns}
									strategy={horizontalListSortingStrategy}
								>
									{columnOrder.map((columnId) => {
										const cell = row
											.getVisibleCells()
											.find((cell) => cell.column.id === columnId)
										if (!cell) return null
										return (
											<DragAlongCell
												key={cell.id}
												cell={cell}
												className={
													classNames?.tableCell
														? classNames.tableCell(cell)
														: ''
												}
											/>
										)
									})}
								</SortableContext>
							</Table.Row>
						)
					}}
				</Table.Body>
			</Table>
		</DndContext>
	)
}

function DraggableTableHeader<TData, TValue>({
	header,
	className,
}: {
	header: Header<TData, TValue>
	className?: string
}) {
	const isSelectColumn = header.id === 'select'

	const { attributes, isDragging, listeners, setNodeRef, transform } =
		useSortable({
			id: header.column.id,
			disabled: isSelectColumn, // Disable dragging for select column
		})

	// Apply column sizing from TanStack Table
	const columnSize = header.getSize()
	const style: CSSProperties = {
		opacity: isDragging ? 0.8 : 1,
		transform: CSS.Translate.toString(transform),
		transition: 'width transform 0.2s ease-in-out',
		whiteSpace: 'nowrap',
		zIndex: isDragging ? 1 : 0,
		width: `${columnSize}px`,
		minWidth: `${columnSize}px`,
		maxWidth: `${columnSize}px`,
	}

	return (
		<Table.Head
			ref={setNodeRef}
			style={style}
			header={header}
			className={cn(
				className,
				!isSelectColumn &&
					'dnd-handle pointer-events-auto cursor-grab active:cursor-grabbing',
				'relative [&:has([role=checkbox])]:max-w-8 [&:has([role=checkbox])]:pl-1',
			)}
			colSpan={header.colSpan}
			{...(!isSelectColumn && {
				...attributes,
				...listeners,
			})}
		>
			<div
				className={cn(
					'flex items-center justify-between',
					!isSelectColumn &&
						'dnd-handle pointer-events-auto cursor-grab active:cursor-grabbing',
				)}
			>
				{header.isPlaceholder
					? null
					: flexRender(header.column.columnDef.header, header.getContext())}
			</div>
		</Table.Head>
	)
}

function DragAlongCell<TData, TValue>({
	cell,
	className,
}: {
	cell: Cell<TData, TValue>
	className?: string
}) {
	const isSelectColumn = cell.column.id === 'select'

	const { isDragging, setNodeRef, transform } = useSortable({
		id: cell.column.id,
		disabled: isSelectColumn, // Disable dragging for select column
	})

	// Apply column sizing from TanStack Table
	const columnSize = cell.column.getSize()
	const style: CSSProperties = React.useMemo(() => {
		return {
			opacity: isDragging ? 0.8 : 1,
			transform: CSS.Translate.toString(transform),
			transition: 'width transform 0.2s ease-in-out',
			border: '1px solid transparent',
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			zIndex: isDragging ? 1 : 0,
			width: columnSize === 150 ? undefined : `${columnSize}px`, // 150 is default, use auto for default
			minWidth: `${columnSize}px`,
			maxWidth: `${columnSize}px`,
		}
	}, [isDragging, transform, columnSize])

	return (
		<Table.Cell
			ref={setNodeRef}
			style={style}
			className={cn('px-1 py-0', className)}
			cell={cell}
		>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</Table.Cell>
	)
}

export default DraggableTable

export type DndTaleComponent = <TData>(
	props: DraggableTableProps<TData>,
) => React.JSX.Element
