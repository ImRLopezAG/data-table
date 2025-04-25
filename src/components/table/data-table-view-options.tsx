import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import type { Table } from '@tanstack/react-table'

import { Icon } from '@ui/icon'

import { Button } from '@ui/button'
import * as DM from '@ui/dropdown-menu'

import type { JSX } from 'react'

interface DataTableViewOptionsProps<TData> {
	table: Table<TData>
}

export function DataTableViewOptions<TData>({
	table,
}: DataTableViewOptionsProps<TData>): JSX.Element {
	return (
		<DM.DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='outline'
					size='sm'
					className='ml-auto hidden h-8 lg:flex'
				>
					<Icon name='Settings2' className='mr-2 h-4 w-4' />
					Columns
				</Button>
			</DropdownMenuTrigger>
			<DM.DropdownMenuContent align='end' className='w-[150px]'>
				<DM.DropdownMenuLabel>Toggle columns</DM.DropdownMenuLabel>
				<DM.DropdownMenuSeparator />
				{table
					.getAllColumns()
					.filter(
						(column) =>
							typeof column.accessorFn !== 'undefined' && column.getCanHide(),
					)
					.map((column) => {
						return (
							<DM.DropdownMenuCheckboxItem
								key={column.id}
								className='capitalize'
								checked={column.getIsVisible()}
								onCheckedChange={(value) => {
									column.toggleVisibility(!!value)
								}}
							>
								{column.id}
							</DM.DropdownMenuCheckboxItem>
						)
					})}
			</DM.DropdownMenuContent>
		</DM.DropdownMenu>
	)
}
