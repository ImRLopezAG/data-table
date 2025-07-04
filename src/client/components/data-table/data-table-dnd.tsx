'use client'
import { cn } from '@/lib/utils'
import type { Table } from '@tanstack/react-table'
import { Suspense, lazy } from 'react'
import { StaticTable } from './data-table-static'

import type { DraggableTableProps } from './dnd-table'

import { buildTable } from './build-table'

const LazyDraggableTable = lazy(() => import('./dnd-table'))

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
						{props.draggable ? (
							<Suspense fallback={<div>Loading...</div>}>
								<LazyDraggableTableWrapper
									table={props.table}
									columnOrder={props.columnOrder}
									handleDragEnd={props.handleDragEnd}
									classNames={props.classNames}
									virtualizer={props.virtualizer}
									emptyState={props.emptyState}
									loading={props.loading}
								/>
							</Suspense>
						) : (
							<StaticTable
								table={props.table}
								emptyState={props.emptyState}
								loading={props.loading}
								virtualizer={props.virtualizer}
								classNames={props.classNames}
							/>
						)}
					</div>
					{props.paginationChildren}
				</div>
			)
		},
	})

	function LazyDraggableTableWrapper<TData>(props: DraggableTableProps<TData>) {
		const draggableProps = {
			...props,
			table: props.table as Table<unknown>,
			classNames:
				props.classNames as DraggableTableProps<unknown>['classNames'],
		}

		return <LazyDraggableTable {...draggableProps} />
	}
}
