import type { Column } from '@tanstack/react-table'
import { Icon } from '@ui/icon'

import { cn } from '@shared/cn'
import { Badge } from '@ui/badge'
import { Button } from '@ui/button'

import * as CMD from '@ui/command'

import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Separator } from '@ui/separator'

import type { JSX } from 'react'

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: Array<{
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options
}: DataTableFacetedFilterProps<TData, TValue>): JSX.Element {
  if (!column) return <></>
  const facets = column.getFacetedUniqueValues()
  const selectedValues = new Set<string>(column.getFilterValue() as string[])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-10 border-dashed'>
          <Icon name='CirclePlus' className='mr-2 h-4 w-4' />
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
                          : undefined
                      )
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Icon name='Check' className={cn('h-4 w-4')} />
                    </div>
                    {option.icon && (
                      <option.icon className='mr-2 h-4 w-4 text-muted-foreground' />
                    )}
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
                        {facets.get(option.value)}
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
