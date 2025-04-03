"use client";
import { cn } from "@shared/cn";
import type { ColumnDef, Row, Table as TTable } from "@tanstack/react-table";
import { DataTablePagination } from "./data-table-pagination";
import { DraggableTable } from "./dnd-table";
import { StaticTable } from "./static-table";
import { useDataTable } from "./use-data-table";
import { withColumns } from "./with-colums";

declare module "@tanstack/react-table" {
	interface ColumnMeta<TData, TValue> {
		filterVariant?: "text" | "range" | "select" | "multi-select";
		editable?: boolean;
	}
	interface TableMeta<TData> {
		updateData: (rowIndex: number, columnId: string, value: unknown) => void;
	}
}
interface DataTableProps<TData> {
	columns: {
		withSelect?: boolean;
		columns: ColumnDef<TData>[];
		rowAction?: (row: Row<TData>) => React.ReactNode;
	};
	data: TData[];
	toolbar?: (table: TTable<TData>) => React.ReactNode;
	emptyState?: React.ReactNode;
	pagination?: "simple" | "complex";
	draggable?: boolean;
	classNames?: {
		container?: string;
		table?: string;
		tableHeader?: string;
		tableHead?: string;
		tableBody?: string;
		tableRow?: string;
		tableCell?: string;
	};
}
export function DataTable<TData>({
	columns,
	data,
	toolbar,
	classNames,
	emptyState,
	pagination,
	draggable,
}: DataTableProps<TData>) {
	const buildedColumns = withColumns<TData>(columns);

	const { table, columnOrder, handleChangeColumnOrder } = useDataTable({
		columns: buildedColumns,
		data,
	});

	return (
		<div className="space-y-4">
			{toolbar?.(table)}
			<div className={cn(classNames?.container, "rounded-md border")}>
				{draggable && (
					<DraggableTable
						table={table}
						columnOrder={columnOrder}
						handleChangeColumnOrder={handleChangeColumnOrder}
						classNames={classNames}
					/>
				)}
				{!draggable && (
					<StaticTable
						table={table}
						classNames={classNames}
						columns={buildedColumns}
						emptyState={emptyState}
					/>
				)}
			</div>
			{pagination && <DataTablePagination table={table} type={pagination} />}
		</div>
	);
}
