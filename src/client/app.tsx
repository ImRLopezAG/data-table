import { createDataTable } from '@components/data-table/data-table-dnd'
import { Button } from '@components/ui/button'
import { Calendar } from '@components/ui/calendar'
import { Checkbox } from '@components/ui/checkbox'
import { Label } from '@components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover'
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import type { Commit } from '@server/services/commit'

import { useCommits } from '@hooks/use-commits'
import { dates, values } from '@lib/utils'
import {
	CalendarClock,
	CheckCircle,
	ChevronDown,
	HelpCircle,
	Loader2,
	XCircle,
} from 'lucide-react'

const CommitTable = createDataTable<Commit>()

export const App = () => {
	const {
		draggable,
		currentPage,
		paginationInfo,
		canPreviousPage,
		canNextPage,
		totalPages,
		status,
		handlePreviousPage,
		handleNextPage,
		handleFirstPage,
		handleLastPage,
		handleReset,
		handleUpdateCommit,
		toggleDraggable,
		isLoading,
		isFetchingNextPage,
		currentPageData,
		hasNextPage,
		ITEMS_PER_PAGE,
		handleSearch,
	} = useCommits()

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
					onClick={handleReset}
				>
					Reset
				</Button>

				{paginationInfo && (
					<div className='text-muted-foreground text-sm'>
						Page {currentPage + 1} of {totalPages} | Loaded{' '}
						{paginationInfo.loadedItems} of {paginationInfo.total} items
					</div>
				)}
			</div>

			<div className='space-y-4'>
				<CommitTable
					draggable={draggable}
					loading={isLoading}
					withSelect
					onDataChange={handleUpdateCommit}
					data={currentPageData} // Use current page data instead of all commits
					pagination={{
						pageSize: ITEMS_PER_PAGE,
						manualPagination: true, // Enable manual pagination
					}}
					classNames={{
						tableRow(row) {
							const status = row.original.status
							return cn({
								'rounded-3xl': true,
								'text-red-400/80': status === 'failed',
								'text-green-500/80': status === 'success',
								'text-yellow-500/80': status === 'pending',
							})
						},
					}}
				>
					<CommitTable.Toolbar
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
						onReset={() => {
							// This will be called when reset button is clicked
							// We need to clear both our custom search state and table filters
							handleReset()
						}}
					>
						<CommitTable.Toolbar.Search>
							{(table) => (
								<input
									type='text'
									placeholder='Search...'
									value={table.getState().globalFilter || ''}
									onChange={(e) => {
										const newValue = e.target.value
										table.setGlobalFilter(newValue)
										handleSearch(newValue)
									}}
									className='h-9 w-fit rounded-md border p-2 text-sm'
								/>
							)}
						</CommitTable.Toolbar.Search>
					</CommitTable.Toolbar>
					<CommitTable.Column accessorKey='hash' filterHeader='Hash' maxSize={20}>
						{({ row }) => row.original.hash.slice(0, 7)}
					</CommitTable.Column>
					<CommitTable.Column
						accessorKey='message'
						filterHeader='Message'
						editable
						size={145}
					>
						{({ row }) => row.original.message}
					</CommitTable.Column>
					<CommitTable.Column
						accessorKey='author'
						filterHeader='Author'
						editable
						maxSize={40}
					>
						{({ row }) => row.original.author}
					</CommitTable.Column>
					<CommitTable.Column
						accessorKey='date'
						filterHeader='Date'
						filterVariant='range'
						editable
												maxSize={30}

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
													handleUpdateCommit({
														id: row.original.id,
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
												maxSize={17}

					>
						{({ row }) => row.original.value}
					</CommitTable.Column>
					<CommitTable.Column
						accessorKey='status'
						header='Status'
						filterVariant='multi-select'
												maxSize={30}

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
														handleUpdateCommit({
															id: row.original.id,
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

					<CommitTable.Pagination.Custom>
						{(table) => (
							<div className='flex items-center justify-between space-x-2 px-2'>
								<div className='flex-1 text-muted-foreground text-sm'>
									{table.getFilteredSelectedRowModel().rows.length} of{' '}
									{currentPageData.length} row(s) selected on this page.
								</div>

								{/* Loading indicator */}
								{isFetchingNextPage && (
									<div className='flex items-center gap-2 text-muted-foreground text-sm'>
										<Loader2 className='size-4 animate-spin' />
										<span>Loading more data...</span>
									</div>
								)}

								<div className='flex items-center space-x-6 lg:space-x-8'>
									<div className='flex items-center space-x-2'>
										<p className='font-medium text-sm'>
											Page {currentPage + 1} of {totalPages} | Showing{' '}
											{currentPageData.length} items
										</p>
									</div>

									<div className='flex items-center space-x-2'>
										<Button
											variant='outline'
											className='hidden h-8 w-8 p-0 lg:flex'
											onClick={handleFirstPage}
											disabled={!canPreviousPage}
										>
											<span className='sr-only'>Go to first page</span>
											<ChevronsLeft className='size-4' />
										</Button>
										<Button
											variant='outline'
											className='h-8 w-8 p-0'
											onClick={handlePreviousPage}
											disabled={!canPreviousPage}
										>
											<span className='sr-only'>Go to previous page</span>
											<ChevronLeft className='size-4' />
										</Button>
										<Button
											variant='outline'
											className='h-8 w-8 p-0'
											onClick={handleNextPage}
											disabled={!canNextPage || isFetchingNextPage}
										>
											<span className='sr-only'>Go to next page</span>
											<ChevronRight className='size-4' />
										</Button>
										<Button
											variant='outline'
											className='hidden h-8 w-8 p-0 lg:flex'
											onClick={handleLastPage}
											disabled={!hasNextPage && !canNextPage}
										>
											<span className='sr-only'>Go to last page</span>
											<ChevronsRight className='size-4' />
										</Button>
									</div>
								</div>
							</div>
						)}
					</CommitTable.Pagination.Custom>
				</CommitTable>
			</div>
		</section>
	)
}
