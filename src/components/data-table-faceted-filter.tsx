import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import * as CMD from '@/components/ui/command'
import { rangeFilter } from './data-table-with-columns'
import { cn } from '@/lib/utils'
import type { Column, Table } from '@tanstack/react-table'
import { Check, Plus } from 'lucide-react'

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'

import { Separator } from '@/components/ui/separator'
import type { JSX } from 'react'

interface DataTableFacetedFilterProps<TData> {
	column?: Column<TData>
	table: Table<TData>
	title?: string
	options: Array<{
		label: string
		value: string
		icon?: React.ComponentType<{ className?: string }>
	}>
}

// Helper function to calculate counts for range filters
function getRangeFilterCounts<TData>(
	table: Table<TData>,
	column: Column<TData>,
	options: Array<{ value: string; label: string }>,
): Map<string, number> {
	const counts = new Map<string, number>()
	const columnId = column.id
	const allRows = table.getPreFilteredRowModel().rows

	// Check if this is a range filter
	const isRangeFilter = column.columnDef.meta?.filterVariant === 'range'

	if (!isRangeFilter) {
		// For non-range filters, use the existing faceted values
		const facets = column.getFacetedUniqueValues()
		for (const option of options) {
			counts.set(option.value, facets.get(option.value) || 0)
		}
		return counts
	}

	// For range filters, manually count matching rows
	for (const option of options) {
		const count = allRows.filter((row) => {
			const value = row.getValue(columnId)
			return rangeFilter(value, [option.value])
		}).length
		counts.set(option.value, count)
	}

	return counts
}

export function DataTableFacetedFilter<TData>({
	column,
	table,
	title,
	options,
}: DataTableFacetedFilterProps<TData>): JSX.Element {
	if (!column) return <></>

	const selectedValues = new Set<string>(column.getFilterValue() as string[])

	// Get counts based on filter type
	const optionCounts = getRangeFilterCounts(table, column, options)

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant='outline' size='sm' className='h-9 border-dashed'>
					<Plus className='mr-2 h-4 w-4' />
					{title}
					{selectedValues?.size > 0 && (
						<>
							<Separator orientation='vertical' className='mx-2 h-4' />
							<Badge
								variant='secondary'
								className='rounded-sm px-1 font-normal lg:hidden'
							>
								{selectedValues.size}
							</Badge>
							<div className='hidden space-x-1 lg:flex'>
								{selectedValues.size > 2 ? (
									<Badge
										variant='secondary'
										className='rounded-sm px-1 font-normal'
									>
										{selectedValues.size} selected
									</Badge>
								) : (
									options
										.filter((option) => selectedValues.has(option.value))
										.map((option) => (
											<Badge
												variant='secondary'
												key={option.value}
												className='rounded-sm px-1 font-normal'
											>
												{option.label}
											</Badge>
										))
								)}
							</div>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-[200px] p-0' align='start'>
				<CMD.Command>
					<CMD.CommandInput placeholder={title} />
					<CMD.CommandList>
						<CMD.CommandEmpty>No results found.</CMD.CommandEmpty>
						<CMD.CommandGroup>
							{options.map((option) => {
								const isSelected = selectedValues.has(option.value)

								return (
									<CMD.CommandItem
										key={option.value}
										onSelect={() => {
											const newSelectedValues = new Set(selectedValues)
											if (isSelected) {
												newSelectedValues.delete(option.value)
											} else {
												newSelectedValues.add(option.value)
											}
											column.setFilterValue(
												newSelectedValues.size
													? Array.from(newSelectedValues)
													: undefined,
											)
										}}
									>
										<div
											className={cn(
												'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
												isSelected
													? 'bg-primary text-primary-foreground'
													: 'opacity-50 [&_svg]:invisible',
											)}
										>
											<Check className={cn('h-4 w-4')} />
										</div>
										{option.icon && (
											<option.icon className='mr-2 h-4 w-4 text-muted-foreground' />
										)}
										<span>{option.label}</span>
										{optionCounts.get(option.value) && (
											<span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
												{optionCounts.get(option.value)}
											</span>
										)}
									</CMD.CommandItem>
								)
							})}
						</CMD.CommandGroup>
						{selectedValues.size > 0 && (
							<>
								<CMD.CommandSeparator />
								<CMD.CommandGroup>
									<CMD.CommandItem
										onSelect={() => column.setFilterValue(undefined)}
										className='justify-center text-center'
									>
										Clear filters
									</CMD.CommandItem>
								</CMD.CommandGroup>
							</>
						)}
					</CMD.CommandList>
				</CMD.Command>
			</PopoverContent>
		</Popover>
	)
}
