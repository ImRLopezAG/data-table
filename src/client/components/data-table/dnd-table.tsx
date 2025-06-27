'use client'
import type { CSSProperties } from 'react'

import {
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	closestCenter,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
	SortableContext,
	horizontalListSortingStrategy,
	useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Cell, Header, Row, Table as TTable } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { GripHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Virtualizer } from '@tanstack/react-virtual'
import { useCallback } from 'react'
import { Table } from './components'

export interface DraggableTableProps<TData> {
	table: TTable<TData>
	columnOrder: string[]
	handleDragEnd: (activeId: string, overId: string) => void
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
	handleDragEnd,
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

	const onHandleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event
			if (active && over && active.id !== over.id) {
				handleDragEnd(active.id as string, over.id as string)
			}
		},
		[handleDragEnd],
	)
	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToHorizontalAxis]}
			onDragEnd={onHandleDragEnd}
		>
			{' '}
			<Table<TData> classNames={classNames} table={table}>
				<Table.Header<TData>>
					{(headerGroup) => (
						<Table.Row key={headerGroup.id}>
							<SortableContext
								items={columnOrder}
								strategy={horizontalListSortingStrategy}
							>
								{columnOrder.map((columnId) => {
									const header = headerGroup.headers.find(
										(h) => h.column.id === columnId,
									)
									if (!header) return null
									return (
										<DraggableTableHeader
											key={header.id}
											header={header}
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
					{(row, virtualRow, index) => (
						<Table.Row
							key={row.id}
							row={row}
							style={{
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start - index * virtualRow.size}px)`,
							}}
							className={classNames?.tableRow ? classNames.tableRow(row) : ''}
						>
							<SortableContext
								items={columnOrder}
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
												classNames?.tableCell ? classNames.tableCell(cell) : ''
											}
										/>
									)
								})}
							</SortableContext>
						</Table.Row>
					)}
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
	const { attributes, isDragging, listeners, setNodeRef, transform } =
		useSortable({
			id: header.column.id,
		})

	const style: CSSProperties = {
		opacity: isDragging ? 0.8 : 1,
		transform: CSS.Translate.toString(transform),
		transition: 'width transform 0.2s ease-in-out',
		whiteSpace: 'nowrap',
		zIndex: isDragging ? 1 : 0,
	}

	return (
		<Table.Head
			ref={setNodeRef}
			style={style}
			className={cn(
				className,
				'relative [&:has([role=checkbox])]:max-w-8 [&:has([role=checkbox])]:pl-1',
			)}
			colSpan={header.colSpan}
		>
			<div className='flex items-center justify-between'>
				{header.isPlaceholder
					? null
					: flexRender(header.column.columnDef.header, header.getContext())}
				<div
					{...attributes}
					{...listeners}
					className='dnd-handle pointer-events-auto cursor-grab active:cursor-grabbing'
				>
					<GripHorizontal className='size-4' />
					<span className='sr-only'>Drag to reorder</span>
				</div>
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
	const { isDragging, setNodeRef, transform } = useSortable({
		id: cell.column.id,
	})

	const style: CSSProperties = {
		opacity: isDragging ? 0.8 : 1,
		transform: CSS.Translate.toString(transform),
		transition: 'width transform 0.2s ease-in-out',
		zIndex: isDragging ? 1 : 0,
	}

	return (
		<Table.Cell
			ref={setNodeRef}
			style={style}
			className={cn('px-1 py-0', className)}
		>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</Table.Cell>
	)
}

export default DraggableTable

export type DndTaleComponent = <TData>(
	props: DraggableTableProps<TData>,
) => React.JSX.Element
