import { createDataTableDnd } from '@/components/data-table-dnd'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'

import { createGlobalState } from '@/hooks/global.state'
import { cn } from '@/lib/utils'
import type { Commit } from '@/services/commit'
import { useMutation } from '@tanstack/react-query'
import {
	CalendarClock,
	CheckCircle,
	ChevronDown,
	HelpCircle,
	XCircle,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { dates, values } from './lib/utils'
function useCommits() {
	return createGlobalState(
		'commits',
		fetch('/api/commits?count=5000').then(async (res) => {
			const json = (await res.json()) as { data: Commit[] }
			return json.data
		}),
	)()
}

// Memoize status options to prevent recreating on every render

const CommitTable = createDataTableDnd<Commit>()
export const App = () => {
	const [draggable, setDraggable] = useState(false)
	const [testLoading, setTestLoading] = useState(false)

	// Memoize toggle function
	const toggleDraggable = useCallback(() => setDraggable((prev) => !prev), [])

	const { data, refetch, isLoading, queryClient } = useCommits()

	// Memoize test loading function
	const triggerTestLoading = useCallback(() => {
		setTestLoading(true)
		setTimeout(() => setTestLoading(false), 3000)
	}, [])

	const updateCommit = useMutation({
		mutationFn: async (commit: Partial<Commit>) => {
			const response = await fetch(`/api/commits/${commit.hash}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(commit),
			})
			if (!response.ok) {
				throw new Error('Failed to update commit')
			}
			const responseData = await response.json()
			return responseData as Commit
		},
		// Optimistic update: immediately update the UI
		async onMutate(newCommit) {
			// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries({ queryKey: ['commits'] })

			// Snapshot the previous value for rollback
			const previousData = queryClient.getQueryData<Commit[]>(['commits'])

			// Optimistically update to the new value immediately
			queryClient.setQueryData(['commits'], (oldData: Commit[] | undefined) => {
				if (!oldData) return []
				return oldData.map((commit) =>
					commit.hash === newCommit.hash ? { ...commit, ...newCommit } : commit,
				)
			})

			return { previousData }
		},
		// If the mutation fails, roll back to the previous state
		onError: (_err, _newCommit, context) => {
			if (context?.previousData) {
				queryClient.setQueryData(['commits'], context.previousData)
			}
		},
	})

	const status = useMemo(
		() =>
			['success', 'failed', 'pending'].map((value) => ({
				value,
				icon:
					value === 'success'
						? CheckCircle
						: value === 'failed'
							? XCircle
							: HelpCircle,
				label: value.charAt(0).toUpperCase() + value.slice(1),
			})),
		[],
	)
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
			<CommitTable
				draggable={draggable}
				loading={isLoading || testLoading}
				onDataChange={(changes) => {
					updateCommit.mutate(changes)
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
			>
				<CommitTable.Toolbar
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
				<CommitTable.Column accessorKey='hash' filterHeader='Hash'>
					{({ row }) => row.original.hash.slice(0, 7)}
				</CommitTable.Column>
				<CommitTable.Column
					accessorKey='message'
					filterHeader='Message'
					editable
				>
					{({ row }) => row.original.message}
				</CommitTable.Column>
				<CommitTable.Column accessorKey='author' filterHeader='Author' editable>
					{({ row }) => row.original.author}
				</CommitTable.Column>
				<CommitTable.Column
					accessorKey='date'
					filterHeader='Date'
					filterVariant='range'
					editable
				>
					{({ row }) => {
						const [open, setOpen] = useState(false)
						return (
							<Popover open={open} onOpenChange={setOpen}>
								<PopoverTrigger asChild>
									<div className='flex h-full w-full items-center justify-between'>
										<Button variant='ghost' className='h-6 px-2'>
											{new Intl.DateTimeFormat('en-US', {
												dateStyle: 'medium',
												calendar: 'gregory',
											}).format(new Date(row.original.date))}
										</Button>
										<CalendarClock className='size-4 text-gray-500' />
									</div>
								</PopoverTrigger>
								<PopoverContent className=''>
									<Calendar
										mode='single'
										selected={new Date(row.original.date)}
										onSelect={(date) => {
											if (date) {
												updateCommit.mutate({
													hash: row.original.hash,
													date: date.toISOString(),
												})
											}
										}}
									/>
								</PopoverContent>
							</Popover>
						)
					}}
				</CommitTable.Column>
				<CommitTable.Column
					accessorKey='value'
					filterHeader='Value'
					filterVariant='range'
				>
					{({ row }) => row.original.value}
				</CommitTable.Column>
				<CommitTable.Column
					accessorKey='status'
					header='Status'
					filterVariant='multi-select'
				>
					{({ row }) => {
						const currentStatus = row.original.status
						const Icon =
							{
								success: CheckCircle,
								failed: XCircle,
								pending: HelpCircle,
							}[currentStatus] || HelpCircle

						return (
							<Popover>
								<PopoverTrigger asChild>
									<div className='flex h-full w-full items-center justify-between'>
										<Button variant='ghost' className='h-6 px-2'>
											<Icon className='size-4 text-gray-500' />
											<span className='ml-2'>
												{currentStatus.charAt(0).toUpperCase() +
													currentStatus.slice(1)}
											</span>
										</Button>
										<ChevronDown className='size-4 text-gray-500' />
									</div>
								</PopoverTrigger>
								<PopoverContent className='w-48'>
									<div className='flex flex-col gap-2'>
										{status.map((option) => (
											<Button
												key={option.value}
												variant='ghost'
												className='justify-start'
												onClick={() => {
													updateCommit.mutate({
														hash: row.original.hash,
														status: option.value as Commit['status'],
													})
												}}
											>
												<option.icon className='size-4 text-gray-500' />
												<span className='ml-2'>{option.label}</span>
											</Button>
										))}
									</div>
								</PopoverContent>
							</Popover>
						)
					}}
				</CommitTable.Column>
				<CommitTable.Pagination type='simple' />
			</CommitTable>
		</section>
	)
}
