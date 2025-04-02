import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useState, useEffect, useRef, useCallback } from "react";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}
export function useDataTable<TData, TValue>({
	columns,
	data: initialData,
}: DataTableProps<TData, TValue>) {
	const [rowSelection, setRowSelection] = useState({});
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnOrder, setColumnOrder] = useState<string[]>(() =>
		columns.map((col) => col.id ?? crypto.randomUUID()),
	);
	const [data, setData] = useState<TData[]>(initialData);
	const [, skipAutoResetPageIndex] = useSkipper();

	const table = useReactTable({
		data,
		columns: columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			columnOrder,
		},
		meta: {
			updateData: (rowIndex, columnId, value) => {
				skipAutoResetPageIndex();
				setData((old) =>
					old.map((row, index) => {
						if (index === rowIndex) {
							return {
								...row,
								[columnId]: value,
							};
						}
						return row;
					}),
				);
			},
		},
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onColumnOrderChange: setColumnOrder,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	return {
    table,
    columnOrder,
    handleChangeColumnOrder: setColumnOrder
  }
}

export function useSkipper() {
	const shouldSkipRef = useRef(true)
	const shouldSkip = shouldSkipRef.current

	const skip = useCallback(() => {
		shouldSkipRef.current = false
	}, [])

	useEffect(() => {
		shouldSkipRef.current = true
	})

	return [shouldSkip, skip] as const
}
