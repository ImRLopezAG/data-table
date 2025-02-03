import { Icon } from '@ui/icon'
import { type Column } from '@tanstack/react-table'

import { cn } from '@shared/cn'
import { Button } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@ui/dropdown-menu'

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className='-ml-3 h-8 data-[state=open]:bg-accent'
          >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <Icon name='ArrowDown' className='ml-2 size-4' />
            ) : column.getIsSorted() === 'asc' ? (
              <Icon name='ArrowUp' className='ml-2 size-4' />
            ) : (
              <Icon name='ArrowDownUp' className='ml-2 size-4' />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <Icon
              name='ArrowUp'
              className='mr-2 size-3.5 text-muted-foreground/70'
            />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <Icon
              name='ArrowDown'
              className='mr-2 size-3.5 text-muted-foreground/70'
            />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <Icon
              name='EyeOff'
              className='mr-2 size-3.5 text-muted-foreground/70'
            />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
