"use client";
import type { ColumnDef, Row, Table } from "@tanstack/react-table";
import { Checkbox } from "@ui/checkbox";
import React, { useEffect, useMemo, useState } from "react";

interface Props<TData> {
	columns: ColumnDef<TData>[];
	rowAction?: (row: Row<TData>) => React.ReactNode;
	withSelect?: boolean;
}

type AccessorColumnDef<TData> = ColumnDef<TData> & {
	accessorKey: string;
};

export function withColumns<TData>({
	columns,
	rowAction,
	withSelect,
}: Props<TData>): Array<ColumnDef<TData>> {


	const processedColumns: ColumnDef<TData>[] = useMemo(
		() =>
			[
        ...(withSelect ? [selectionColumn<TData>()] : []),
        ...columns,
        ...(rowAction ? [actionColumn<TData>(rowAction)] : []),
      ].map((column) => {
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
		[columns, rowAction, withSelect],
	);
	return processedColumns;
}

function selectionColumn<TData>(): ColumnDef<TData> {
	return {
		id: "select",
		header: ({ table }) => {
			const checked = table.getIsAllPageRowsSelected();
			const onCheckedChange = React.useCallback(
				(value: boolean) => table.toggleAllPageRowsSelected(!!value),
				[table]
			);
			return (
				<Checkbox
					checked={checked}
					onCheckedChange={onCheckedChange}
				/>
			);
		},
		cell: ({ row }) => {
			const checked = row.getIsSelected();
			const onCheckedChange = React.useCallback(
				(value: boolean) => row.toggleSelected(!!value),
				[row]
			);
			return (
				<Checkbox
					checked={checked}
					onCheckedChange={onCheckedChange}
				/>
			);
		},
	}
};

// Helper for action column
const actionColumn = <TData,>(
	rowAction: (row: Row<TData>) => React.ReactNode,
): ColumnDef<TData> => ({
	id: "actions",
	cell: ({ row }) => rowAction(row),
});


interface EditableCellProps<TData, TValue> {
	getValue: () => TValue;
	rowIndex: number;
	columnId: string;
	table: Table<TData>;
}

const EditableCell = <TData, TValue>({
	getValue,
	rowIndex,
	columnId,
	table,
}: EditableCellProps<TData, TValue>) => {
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
}
