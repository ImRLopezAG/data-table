import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Table } from "@tanstack/react-table";
import { Fragment, type JSX } from "react";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

export interface DataTableToolbarProps<TData> {
	createComponent?: React.ReactNode;
	table: Table<TData>;
	filter: {
		placeholder?: string;
		column: string;
	};
	showViewOptions?: boolean;
	filters?: Array<{
		column: string;
		title?: string;
		options: Array<{
			label: string;
			value: string;
			icon?: React.ComponentType<{ className?: string }>;
		}>;
	}>;
	classNames?: {
		input?: string;
		content?: string;
	};
}

export function DataTableToolbar<TData>({
	table,
	createComponent,
	filters,
	filter,
	showViewOptions,
	classNames,
}: DataTableToolbarProps<TData>): JSX.Element {
	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div
			className={cn("flex items-center justify-between", classNames?.content)}
		>
			<div className="flex flex-1 items-center space-x-2">
				<Input
					placeholder={filter.placeholder ?? "Filter..."}
					value={
						(table.getColumn(filter.column)?.getFilterValue() as string) ?? ""
					}
					onChange={({ target: { value } }) =>
						table.getColumn(filter.column)?.setFilterValue(value)
					}
					className={cn("h-9 w-fit", classNames?.input)}
				/>
				{createComponent}
				{filters?.map((filter) => (
					<Fragment key={filter.column}>
						{table.getColumn(filter.column) && (
							<DataTableFacetedFilter
								table={table}
								column={table.getColumn(filter.column)}
								title={filter.title}
								options={filter.options}
							/>
						)}
					</Fragment>
				))}
				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => {
							table.resetColumnFilters();
						}}
						className="h-8 px-2 lg:px-3"
					>
						Reset
						<Icon name="X" className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
			{showViewOptions && <DataTableViewOptions table={table} />}
		</div>
	);
}

export default DataTableToolbar;