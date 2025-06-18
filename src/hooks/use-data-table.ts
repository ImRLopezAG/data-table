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
import { useState } from "react";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: "text" | "range" | "select" | "multi-select";
    editable?: boolean;
    filterHeader?: string

  }
  interface TableMeta<TData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onDataChange?: (data: TData[], changes: TData) => void;
  pagination?: {
    enabled: boolean;
    pageSize?: number;
  };
}
export function useDataTable<TData, TValue>({
  columns,
  data,
  onDataChange,
  pagination,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns.map((col) => col.id ?? crypto.randomUUID()),
  );

  const isPaginationEnabled = pagination?.enabled ?? false;

  const table = useReactTable({
    data,
    columns: columns,
    enableRowSelection: true,
    ...(isPaginationEnabled && {
      initialState: {
        pagination: {
          pageSize: pagination?.pageSize ?? 10,
        },
      },
    }),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      columnOrder,
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        if (onDataChange) {
          const newData = [...data].map((row, idx) =>
            idx === rowIndex ? { ...row, [columnId]: value } : row
          );
          const changes = newData[rowIndex];
          if (!changes) return;
          onDataChange(newData, changes);
        }
      },
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(isPaginationEnabled && { getPaginationRowModel: getPaginationRowModel() }),
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

