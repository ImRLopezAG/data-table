import {
	DataTable,
	DataTableColumnHeader,
	DataTableToolbar,
} from '@components/table'
import { createGlobalState } from '@hooks/global.state'
import { fakeCommits } from '@services/commit'
import { Button } from '@ui/button'
import { Checkbox } from '@ui/checkbox'
import { Label } from '@ui/label'
import { useState } from 'react'
import { dates, status, values } from './lib/utils'
import { cn } from './shared/cn'

function useCommits() {
	return createGlobalState('commits', fakeCommits(200))()
}

export const App = () => {
	const [draggable, setDraggable] = useState(false)
	const toggleDraggable = () => setDraggable((prev) => !prev)
	const { data, refetch, setData } = useCommits()

	return (
		<section className='space-y-4 p-4'>
			<div className='flex items-baseline gap-4'>
				<h1 className='font-bold text-2xl'>Commits</h1>
				<div className='flex items-center gap-2'>
					<Label htmlFor='draggable' className='text-sm'>
						Draggable
					</Label>
					<Checkbox
						id='draggable'
						checked={draggable}
						onCheckedChange={toggleDraggable}
						className='peer baseline'
					/>
				</div>
				<Button
					size='sm'
					variant='destructive'
					onClick={() => {
						refetch()
					}}
				>
					Refresh Data
				</Button>
			</div>
			<DataTable
				draggable={draggable}
				devtools
				onDataChange={(data, changes) => {
					setData(data)
					console.log({ changes })
				}}
				pagination='simple'
				data={data ?? []}
				classNames={{
					tableRow(row) {
						const status = row.original.status
						return cn({
							'rounded-3xl': true,
							'bg-red-500/40': status === 'failed',
							'bg-green-500/40': status === 'success',
							'bg-yellow-500/40': status === 'pending',
						})
					},
				}}
				toolbar={{
					filter: {
						column: 'message',
						placeholder: 'Search by message...',
					},
					filters: [
						{
							column: 'status',
							title: 'Status',
							options: status,
						},
						{
							column: 'date',
							title: 'Date',
							options: dates,
						},
						{
							column: 'value',
							title: 'Value',
							options: values,
						},
					],
				}}
				columns={{
					withSelect: true,
					columns: [
						{
							accessorKey: 'hash',
							header: 'Hash',
							cell: ({ row }) => row.original.hash.slice(0, 7),
						},
						{
							accessorKey: 'message',
							header: ({ column }) => (
								<DataTableColumnHeader column={column} title='Message' />
							),
							cell: ({ row }) => row.original.message,
							meta: {
								editable: true,
							},
						},
						{
							accessorKey: 'author',
							header: ({ column }) => (
								<DataTableColumnHeader column={column} title='Author' />
							),
							cell: ({ row }) => row.original.author,
							meta: {
								editable: true,
							},
						},
						{
							accessorKey: 'date',
							header: ({ column }) => (
								<DataTableColumnHeader column={column} title='Date' />
							),
							cell: ({ row }) =>
								new Intl.DateTimeFormat('en-US', {
									formatMatcher: 'basic',
									dateStyle: 'medium',
								}).format(new Date(row.original.date)),
							meta: {
								filterVariant: 'range',
							},
						},
						{
							accessorKey: 'value',
							header: ({ column }) => (
								<DataTableColumnHeader column={column} title='Value' />
							),
							cell: ({ row }) => row.original.value,
							meta: {
								filterVariant: 'range',
							},
						},
						{
							accessorKey: 'status',
							header: 'Status',
							cell: ({ row }) => row.original.status,
							meta: {
								filterVariant: 'multi-select',
							},
						},
					],
				}}
			/>
		</section>
	)
}
