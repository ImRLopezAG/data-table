import { createDataTable } from '@components/data-table/data-table-dnd'
import { Button } from '@components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover'
import { todosCollection } from '@lib/db/todos'
import type { Todo } from '@server/schemas/todo.schema'
import { useLiveQuery } from '@tanstack/react-db'
import { createLazyFileRoute } from '@tanstack/react-router'
import {
	ArrowDown,
	ArrowRight,
	ArrowUp,
	Box,
	Bug,
	CheckCircle,
	ChevronDown,
	Circle,
	CircleOff,
	FileCode,
	HelpCircle,
	Network,
	Timer,
	Trash2,
} from 'lucide-react'
import { useCallback } from 'react'
export const Route = createLazyFileRoute('/about')({
	component: About,
})
const TodoTable = createDataTable<Todo>()

function About() {
	const { data, isLoading, collection } = useLiveQuery(todosCollection)
	const STATUS_OPTIONS = [
		{ value: 'todo', icon: Circle, label: 'Todo' },
		{ value: 'backlog', icon: HelpCircle, label: 'Backlog' },
		{ value: 'in-progress', icon: Timer, label: 'In Progress' },
		{ value: 'done', icon: CheckCircle, label: 'Done' },
		{ value: 'cancelled', icon: CircleOff, label: 'Cancelled' },
		{ value: 'archived', icon: Box, label: 'Archived' },
	]

	const STATUS_ICONS = {
		backlog: HelpCircle,
		'in-progress': Timer,
		done: CheckCircle,
		cancelled: CircleOff,
		archived: Box,
		todo: Circle,
	} as const

	const PRIORITY_OPTIONS = [
		{ value: 'low', icon: ArrowDown, label: 'Low' },
		{ value: 'medium', icon: ArrowRight, label: 'Medium' },
		{ value: 'high', icon: ArrowUp, label: 'High' },
	]

	const PRIORITY_ICONS = {
		low: ArrowDown,
		medium: ArrowRight,
		high: ArrowUp,
	} as const

	const LABEL_OPTIONS = [
		{ value: 'bug', icon: Bug, label: 'Bug' },
		{ value: 'feature', icon: Network, label: 'Feature' },
		{ value: 'documentation', icon: FileCode, label: 'Documentation' },
	]

	const LABEL_ICONS = {
		bug: Bug,
		feature: Network,
		documentation: FileCode,
	} as const

	const handleUpdateCommit = useCallback((id: string, data: Partial<Todo>) => {
		collection.update(
			id,
			{
				optimistic: true,
			},
			(draft) => {
				Object.assign(draft, data)
			},
		)
	}, [])

	const handleDeleteCommit = useCallback((id: string) => {
		collection.delete(id)
	}, [])

	return (
		<div className='flex h-full w-full items-center justify-center p-4'>
			<TodoTable
				loading={isLoading}
				withSelect
				onDataChange={(data) => {
					handleUpdateCommit(data.id, data)
				}}
				data={data}
			>
				<TodoTable.Toolbar
					filters={[
						{
							column: 'status',
							title: 'Status',
							options: STATUS_OPTIONS,
						},
						{
							column: 'priority',
							title: 'Priority',
							options: PRIORITY_OPTIONS,
						},
						{
							column: 'labels',
							title: 'Labels',
							options: LABEL_OPTIONS,
						},
					]}
				>
					<TodoTable.Toolbar.Search>
						{(table) => (
							<input
								type='text'
								placeholder='Search...'
								value={table.getState().globalFilter || ''}
								onChange={(e) => {
									const newValue = e.target.value
									table.setGlobalFilter(newValue)
									// collection.utils.search(newValue)
								}}
								className='h-9 w-fit rounded-md border p-2 text-sm'
							/>
						)}
					</TodoTable.Toolbar.Search>
				</TodoTable.Toolbar>
				<TodoTable.Column accessorKey='hash' filterHeader='Hash' size={40}>
					{({ row }) => row.original.id.slice(0, 7)}
				</TodoTable.Column>
				<TodoTable.Column
					accessorKey='description'
					filterHeader='Description'
					editable
					size={200}
				>
					{({ row }) => row.original.description}
				</TodoTable.Column>
				<TodoTable.Column accessorKey='title' filterHeader='Title' editable>
					{({ row }) => row.original.title}
				</TodoTable.Column>
				<TodoTable.Column
					accessorKey='status'
					header='Status'
					filterVariant='multi-select'
				>
					{({ row }) => {
						const currentStatus = row.original.status
						const Icon = STATUS_ICONS[currentStatus] || HelpCircle

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
										{STATUS_OPTIONS.map((option) => (
											<Button
												key={option.value}
												variant='ghost'
												className='justify-start'
												onClick={() => {
													handleUpdateCommit(row.original.id, {
														status: option.value as Todo['status'],
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
				</TodoTable.Column>
				<TodoTable.Column
					accessorKey='priority'
					header='Priority'
					filterVariant='multi-select'
				>
					{({ row }) => {
						const currentPriority = row.original.priority
						const Icon = PRIORITY_ICONS[currentPriority] || ArrowDown

						return (
							<Popover>
								<PopoverTrigger asChild>
									<div className='flex h-full w-full items-center justify-between'>
										<Button variant='ghost' className='h-6 px-2'>
											<Icon className='size-4 text-gray-500' />
											<span className='ml-2'>
												{currentPriority.charAt(0).toUpperCase() +
													currentPriority.slice(1)}
											</span>
										</Button>
										<ChevronDown className='size-4 text-gray-500' />
									</div>
								</PopoverTrigger>
								<PopoverContent className='w-48'>
									<div className='flex flex-col gap-2'>
										{PRIORITY_OPTIONS.map((option) => (
											<Button
												key={option.value}
												variant='ghost'
												className='justify-start'
												onClick={() => {
													handleUpdateCommit(row.original.id, {
														priority: option.value as Todo['priority'],
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
				</TodoTable.Column>
				<TodoTable.Column
					accessorKey='labels'
					header='Labels'
					filterVariant='multi-select'
				>
					{({ row }) => {
						const currentLabel = row.original.label
						const Icon = LABEL_ICONS[currentLabel] || Bug
						return (
							<Popover>
								<PopoverTrigger asChild>
									<div className='flex h-full w-full items-center justify-between'>
										<Button variant='ghost' className='h-6 px-2'>
											<Icon className='size-4 text-gray-500' />
											<span className='ml-2'>
												{currentLabel.charAt(0).toUpperCase() +
													currentLabel.slice(1)}
											</span>
										</Button>
										<ChevronDown className='size-4 text-gray-500' />
									</div>
								</PopoverTrigger>
								<PopoverContent className='w-48'>
									<div className='flex flex-col gap-2'>
										{LABEL_OPTIONS.map((option) => (
											<Button
												key={option.value}
												variant='ghost'
												className='justify-start'
												onClick={() => {
													handleUpdateCommit(row.original.id, {
														label: option.value as Todo['label'],
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
				</TodoTable.Column>
				<TodoTable.Actions size={40}>
					{({
						row: {
							original: { id },
						},
					}) => (
						<TodoTable.Actions.Action>
							<TodoTable.Actions.Action.Item
								label='Delete'
								icon={Trash2}
								onAction={() => {
									handleDeleteCommit(id)
								}}
							/>
						</TodoTable.Actions.Action>
					)}
				</TodoTable.Actions>
				<TodoTable.Pagination type='simple' />
			</TodoTable>
		</div>
	)
}
