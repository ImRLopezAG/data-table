import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/client/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from 'lucide-react'
import React from 'react'

interface DataTableColumnHeaderProps<TData>
	extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData>
	title: string
}

export function DataTableColumnHeader<TData>({
	column,
	title,
	className,
	...props
}: DataTableColumnHeaderProps<TData>) {
	// Memoize callback functions to prevent unnecessary re-renders
	const handleSortAsc = React.useCallback(() => {
		column.toggleSorting(false)
	}, [column])

	const handleSortDesc = React.useCallback(() => {
		column.toggleSorting(true)
	}, [column])

	const handleToggleVisibility = React.useCallback(() => {
		column.toggleVisibility(false)
	}, [column])

	// Early return for non-sortable columns
	if (!column.getCanSort()) {
		return <div className={cn(className)}>{title}</div>
	}

	// Memoize sort icon to prevent recalculation
	const sortIcon = React.useMemo(() => {
		const sortState = column.getIsSorted()
		switch (sortState) {
			case 'desc':
				return <ArrowDown className='ml-2 size-4' />
			case 'asc':
				return <ArrowUp className='ml-2 size-4' />
			default:
				return <ArrowUpDown className='ml-2 size-4' />
		}
	}, [column.getIsSorted()])

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div className='between flex h-6 w-fit cursor-pointer select-none items-center rounded px-1 font-medium text-muted-foreground text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground' {...props}>
					<span>{title}</span>
					{sortIcon}
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start'>
				<DropdownMenuItem onClick={handleSortAsc}>
					<ArrowUp className='mr-2 size-3.5 text-muted-foreground/70' />
					Asc
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleSortDesc}>
					<ArrowDown className='mr-2 size-3.5 text-muted-foreground/70' />
					Desc
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleToggleVisibility}>
					<EyeOff className='mr-2 size-3.5 text-muted-foreground/70' />
					Hide
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export default DataTableColumnHeader
