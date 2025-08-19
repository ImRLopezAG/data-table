import { cn } from '@/lib/utils'
import { buildTable } from './build-table'
import { StaticTable } from './data-table-static'

export function createDataTable<TData>() {
	return buildTable<TData>({
		children(props) {
			return (
				<div className='space-y-4'>
					{props.toolbarChildren}

					<div
						className={cn(props.classNames?.container, 'rounded-md border')}
						ref={props.parentRef}
					>
						<StaticTable
							table={props.table}
							emptyState={props.emptyState || <div>No data available</div>}
							loading={props.loading}
							virtualizer={props.virtualizer}
							classNames={props.classNames}
						/>
					</div>

					{props.paginationChildren}
				</div>
			)
		},
	})
}
