import { DataTable } from '@/components/data-table-dnd'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { createGlobalState } from '@/hooks/global.state'
import { cn } from '@/lib/utils'
import type { Commit } from '@/services/commit'
import {
	CheckCircle,
	Circle,
	CircleOff,
	HelpCircle,
	Timer,
	XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { dates, values } from './lib/utils'

function useCommits() {
	return createGlobalState(
		'commits',
		fetch('/api/commits?count=500').then(async (res) => {
			const json = (await res.json()) as { data: Commit[] }
			return json.data
		}),
	)()
}

const status = ['success', 'failed', 'pending'].map((value) => ({
	value,
	icon:
		value === 'success'
			? CheckCircle
			: value === 'failed'
				? XCircle
				: HelpCircle,
	label: value.charAt(0).toUpperCase() + value.slice(1),
}))

export const App = () => {
	const [draggable, setDraggable] = useState(false)
	const [testLoading, setTestLoading] = useState(false)
	const toggleDraggable = () => setDraggable((prev) => !prev)
	const { data, refetch, setData, isLoading } = useCommits()

	const triggerTestLoading = () => {
		setTestLoading(true)
		setTimeout(() => setTestLoading(false), 3000)
	}

	return (
		<section className='space-y-4 p-4'>
			<div className='mb-12 flex items-baseline gap-4'>
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
					className='h-6'
					onClick={() => {
						refetch()
					}}
				>
					Refresh Data
				</Button>
				<Button
					size='sm'
					variant='outline'
					className='h-6'
					onClick={triggerTestLoading}
				>
					Test Loading
				</Button>
			</div>
			<DataTable
				draggable={draggable}
				loading={isLoading || testLoading}
				onDataChange={(data, changes) => {
					//@ts-ignore
					setData(data)
					console.log({ changes })
				}}
				data={data ?? []}
				pagination={{
					pageSize: 20,
				}}
				classNames={{
					tableRow(row) {
						const status = row.original.status
						return cn({
							'rounded-3xl': true,
							'text-red-500/80': status === 'failed',
							'text-green-500/80': status === 'success',
							'text-yellow-500/80': status === 'pending',
						})
					},
				}}
				columns={{
					withSelect: true,
					columns: [
						{
							accessorKey: 'hash',
							cell: ({ row }) => row.original.hash.slice(0, 7),
							meta: {
								filterHeader: 'Hash',
							},
						},
						{
							accessorKey: 'message',
							cell: ({ row }) => row.original.message,
							meta: {
								editable: true,
								filterHeader: 'Message',
							},
						},
						{
							accessorKey: 'author',
							cell: ({ row }) => row.original.author,
							meta: {
								editable: true,
								filterHeader: 'Author',
							},
						},
						{
							accessorKey: 'date',
							cell: ({ row }) =>
								new Intl.DateTimeFormat('en-US', {
									formatMatcher: 'basic',
									dateStyle: 'medium',
								}).format(new Date(row.original.date)),
							meta: {
								filterVariant: 'range',
								filterHeader: 'Date',
							},
						},
						{
							accessorKey: 'value',
							cell: ({ row }) => row.original.value,
							meta: {
								filterVariant: 'range',
								filterHeader: 'Value',
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
			>
				<DataTable.Toolbar
					filter={{
						column: 'message',
						placeholder: 'Search by message...',
					}}
					filters={[
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
					]}
				/>
				<DataTable.Pagination type='simple' />
			</DataTable>
		</section>
	)
}

export default App
