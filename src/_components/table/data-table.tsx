"use client";
import { cn } from "@shared/cn";
import type { ColumnDef, Row, Table as TTable } from "@tanstack/react-table";

import { useEffect, useMemo, useState } from "react";

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

type AccessorColumnDef<TData> = ColumnDef<TData> & {
	accessorKey: string;
};

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
	const processedColumns: ColumnDef<TData>[] = useMemo(
		() =>
			buildedColumns.map((column) => {
				const id =
					column.id ||
					("accessorKey" in column
						? (column as unknown as AccessorColumnDef<TData>).accessorKey
						: `col-${Math.random().toString(36).slice(2, 9)}`);
				const enhancedColumn: ColumnDef<TData> = {
					...column,
					id,
					...(column.meta?.filterVariant === "multi-select" && {
						filterFn: (row, columnId, filterValue) => {
							return filterValue?.includes(row.getValue(columnId));
						},
					}),
				};
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
					};
				}
				return enhancedColumn;
			}),
		[buildedColumns],
	);

	const { table, columnOrder, handleChangeColumnOrder } = useDataTable({
		columns: processedColumns,
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
						columns={processedColumns}
						emptyState={emptyState}
					/>
				)}
			</div>
			{pagination && <DataTablePagination table={table} type={pagination} />}
		</div>
	);
}

const EditableCell = <TData, TValue>({
	getValue,
	rowIndex,
	columnId,
	table,
}: {
	getValue: () => TValue;
	rowIndex: number;
	columnId: string;
	table: TTable<TData>;
}) => {
	const initialValue = getValue();
	const [value, setValue] = useState(initialValue);

	const onBlur = () => {
		table.options.meta?.updateData(rowIndex, columnId, value);
	};

	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	return (
		<input
			value={value as string}
			onChange={(e) => setValue(e.target.value as unknown as TValue)}
			onBlur={onBlur}
			className="w-full bg-transparent"
		/>
	);
};
