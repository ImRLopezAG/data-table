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
	arrayMove,
	horizontalListSortingStrategy,
	useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { flexRender } from '@tanstack/react-table'

import type { Cell, Header, Row, Table as TTable } from '@tanstack/react-table'

import { Icon } from '@/components/ui/icon'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DraggableTableProps<TData> {
	table: TTable<TData>
	columnOrder: string[]
	handleChangeColumnOrder: (columnOrder: string[]) => void
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

import { useCallback } from 'react'

export function DraggableTable<TData>({
	table,
	columnOrder,
	classNames,
	handleChangeColumnOrder,
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

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event
			if (active && over && active.id !== over.id) {
				const oldIndex = columnOrder.indexOf(active.id as string)
				const newIndex = columnOrder.indexOf(over.id as string)
				const newColumnOrder = arrayMove([...columnOrder], oldIndex, newIndex)
				handleChangeColumnOrder(newColumnOrder)
			}
		},
		[columnOrder, handleChangeColumnOrder],
	)
	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToHorizontalAxis]}
			onDragEnd={handleDragEnd}
		>
			<Table className={classNames?.table}>
				<TableHeader className={classNames?.tableHeader}>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							<SortableContext
								items={columnOrder}
								strategy={horizontalListSortingStrategy}
							>
								{headerGroup.headers.map((header) => (
									<DraggableTableHeader
										key={header.id}
										header={header}
										className={cn(
											classNames?.tableHead ? classNames.tableHead(header) : '',
										)}
									/>
								))}
							</SortableContext>
						</TableRow>
					))}
				</TableHeader>
				<TableBody className={classNames?.tableBody}>
					{table.getRowModel().rows.map((row) => (
						<TableRow
							key={row.id}
							data-state={row.getIsSelected() && 'selected'}
							className={cn(
								classNames?.tableRow ? classNames.tableRow(row) : '',
							)}
						>
							{row.getVisibleCells().map((cell) => (
								<DragAlongCell
									key={cell.id}
									cell={cell}
									className={cn(
										classNames?.tableCell ? classNames.tableCell(cell) : '',
									)}
								/>
							))}
						</TableRow>
					))}
				</TableBody>
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
		<TableHead
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
					<Icon name='GripHorizontal' className='size-4' />
					<span className='sr-only'>Drag to reorder</span>
				</div>
			</div>
		</TableHead>
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
		<TableCell
			ref={setNodeRef}
			style={style}
			className={cn('p-1 align-baseline', className)}
		>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</TableCell>
	)
}

export default DraggableTable

export type DndTaleComponent =  typeof DraggableTable