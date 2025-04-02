import type { CSSProperties } from "react";

import {
	DndContext,
	type DragEndEvent,
	type SensorDescriptor,
	type SensorOptions,
	closestCenter,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
	SortableContext,
	horizontalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { flexRender } from "@tanstack/react-table";

import type { Cell, Header } from "@tanstack/react-table";

import { cn } from "@shared/cn";
import { Icon } from "@ui/icon";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/table";

import type { Table as TTable } from "@tanstack/react-table";

interface DraggableTableProps<TData> {
	table: TTable<TData>;
	columnOrder: string[];
	handleDragEnd: (event: DragEndEvent) => void;
	sensors?: SensorDescriptor<SensorOptions>[];
	classNames?: {
		table?: string;
		tableHeader?: string;
		tableRow?: string;
		tableHead?: string;
		tableCell?: string;
		tableBody?: string;
	};
}

export function DraggableTable <TData>({
	table,
	columnOrder,
	handleDragEnd,
	classNames,
	sensors,
}: DraggableTableProps<TData>) {
  return (
    (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
      >
        <Table className={classNames?.table}>
          <TableHeader className={classNames?.tableHeader}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={classNames?.tableRow}>
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {headerGroup.headers.map((header) => (
                    <DraggableTableHeader
                      key={header.id}
                      header={header}
                      className={classNames?.tableHead}
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
                data-state={row.getIsSelected() && "selected"}
                className={classNames?.tableRow}
              >
                {row.getVisibleCells().map((cell) => (
                  <DragAlongCell
                    key={cell.id}
                    cell={cell}
                    className={classNames?.tableCell}
                  />
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DndContext>
    )
  )
}

function DraggableTableHeader <TData, TValue>({
	header,
	className,
}: {
	header: Header<TData, TValue>;
	className?: string;
}) {
	const { attributes, isDragging, listeners, setNodeRef, transform } =
		useSortable({
			id: header.column.id,
		});

	const style: CSSProperties = {
		opacity: isDragging ? 0.8 : 1,
		transform: CSS.Translate.toString(transform),
		transition: "width transform 0.2s ease-in-out",
		whiteSpace: "nowrap",
		zIndex: isDragging ? 1 : 0,
	};

	return (
		<TableHead
			ref={setNodeRef}
			style={style}
			className={cn(className, "relative [&:has([role=checkbox])]:pl-3")}
			colSpan={header.colSpan}
		>
			<div className="flex items-center justify-between">
				{header.isPlaceholder
					? null
					: flexRender(header.column.columnDef.header, header.getContext())}
				{/* Add pointer-events-auto to ensure button can receive events */}
				<div
					{...attributes}
					{...listeners}
					className="dnd-handle pointer-events-auto cursor-grab active:cursor-grabbing"
				>
					<Icon name="GripHorizontal" className="size-4" />
					<span className="sr-only">Drag to reorder</span>
				</div>
			</div>
		</TableHead>
	);
};

function DragAlongCell <TData, TValue>({
	cell,
	className,
}: {
	cell: Cell<TData, TValue>;
	className?: string;
})  {
	const { isDragging, setNodeRef, transform } = useSortable({
		id: cell.column.id,
	});

	const style: CSSProperties = {
		opacity: isDragging ? 0.8 : 1,
		transform: CSS.Translate.toString(transform),
		transition: "width transform 0.2s ease-in-out",
		zIndex: isDragging ? 1 : 0,
	};

	return (
		<TableCell ref={setNodeRef} style={style} className={className}>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</TableCell>
	);
};
