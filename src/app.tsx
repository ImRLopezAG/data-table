import {
	DataTable,
	DataTableColumnHeader,
	DataTableToolbar,
} from "@components/table";
import { fakeCommits, type Commit } from "@services/commit";
import { ReactTableDevtools } from "@tanstack/react-table-devtools";
import { Checkbox } from "@ui/checkbox";
import { useState } from "react";
import { cn } from "./shared/cn";
import type { Table } from "@tanstack/react-table";
export const App = () => {
	const [draggable, setDraggable] = useState(false);
	const toggleDraggable = () => setDraggable((prev) => !prev);
	const [table, setTable] = useState<null | Table<Commit>>(null);
	return (
		<section className="p-4">
			<div className="flex items-baseline gap-4">
				<h1 className="text-2xl font-bold">Commits</h1>
				<Checkbox
					checked={draggable}
					onCheckedChange={toggleDraggable}
					className="mt-2"
				/>
			</div>
			<DataTable
				draggable={draggable}
				pagination="simple"
				data={fakeCommits(200)}
				classNames={{
					tableRow(row) {
						const status = row.original.status;
						return cn({
							"rounded-3xl": true,
							"bg-red-500/40": status === "failed",
							"bg-green-500/40": status === "success",
							"bg-yellow-500/40": status === "pending",
						});
					},
				}}
				toolbar={(table) => {
					// Use useEffect in the parent component to update the table state
					if (table !== null && table !== undefined) {
						// Only update when table actually changes and is not null
						// This avoids the setState during render issue
						setTimeout(() => setTable(table), 0);
					}
					return (
						<DataTableToolbar
							table={table}
							filter={{
								column: "message",
								placeholder: "Search by message...",
							}}
							filters={[
								{
									column: "status",
									title: "Status",
									options: [
										{ label: "Pending", value: "pending" },
										{ label: "Success", value: "success" },
										{ label: "Failed", value: "failed" },
									],
								},
							]}
						/>
					);
				}}
				columns={{
					withSelect: true,
					columns: [
						{
							accessorKey: "hash",
							header: "Hash",
							cell: ({ row }) => row.original.hash.slice(0, 7),
						},
						{
							accessorKey: "message",
							header: ({ column }) => (
								<DataTableColumnHeader column={column} title="Message" />
							),
							cell: ({ row }) => row.original.message,
							meta: {
								editable: true,
							},
						},
						{
							accessorKey: "author",
							header: ({ column }) => (
								<DataTableColumnHeader column={column} title="Author" />
							),
							cell: ({ row }) => row.original.author,
							meta: {
								editable: true,
							},
						},
						{
							accessorKey: "date",
							header: ({ column }) => (
								<DataTableColumnHeader column={column} title="Date" />
							),
							cell: ({ row }) =>
								new Intl.DateTimeFormat("en-US", {
									formatMatcher: "basic",
									dateStyle: "medium",
								}).format(new Date(row.original.date)),
						},
						{
							accessorKey: "status",
							header: "Status",
							cell: ({ row }) => row.original.status,
							meta: {
								filterVariant: "multi-select",
							},
						},
					],
				}}
			/>
			<ReactTableDevtools table={table} />
		</section>
	);
};
