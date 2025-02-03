import type { Table } from '@tanstack/react-table'
import { Fragment, type JSX } from 'react'
import { Icon } from '@ui/icon'

import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { DataTableViewOptions } from './data-table-view-options'
interface DataTableToolbarProps<TData> {
  createComponent?: React.ReactNode
  table: Table<TData>
  filter: {
    placeholder?: string
    column: string
  }
  filters?: Array<{
    column: string
    title?: string
    options: Array<{
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }>
  }>
}

export function DataTableToolbar<TData>({
  table,
  createComponent,
  filters,
  filter
}: DataTableToolbarProps<TData>): JSX.Element {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 items-center space-x-2'>
        <Input
          placeholder={filter.placeholder ?? 'Filter...'}
          value={
            (table.getColumn(filter.column)?.getFilterValue() as string) ?? ''
          }
          onChange={({ target: { value } }) =>
            table.getColumn(filter.column)?.setFilterValue(value)
          }
          className='lg:w-[250px]'
        />
        {createComponent}
        {filters?.map((filter) => (
          <Fragment key={filter.column}>
            {table.getColumn(filter.column) && (
              <DataTableFacetedFilter
                column={table.getColumn(filter.column)}
                title={filter.title}
                options={filter.options}
              />
            )}
          </Fragment>
        ))}
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              table.resetColumnFilters()
            }}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Icon name='Ban' className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
