import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
	useSuspenseInfiniteQuery,
	useTRPC,
} from '@lib/trpc'
import type { InfiniteData } from '@tanstack/react-query'
import { CheckCircle, HelpCircle, XCircle } from 'lucide-react'
import type React from 'react'
import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from 'react'
import { toast } from 'sonner'
import type { Commit } from '@/server/schemas/commit.schema'

// Constants
const ITEMS_PER_PAGE = 20
const SEARCH_DEBOUNCE_DELAY = 500

// Types
interface PaginationState {
	currentPage: number
	search: string
}

interface PaginationInfo {
	currentPage: number
	totalPages: number
	total: number
	hasNext: boolean
	loadedItems: number
	pageSize: number
	loadedPages: number
}

interface StatusOption {
	value: string
	icon: React.ComponentType<{ className?: string }>
	label: string
}

type PaginationAction =
	| { type: 'SET_PAGE'; page: number }
	| { type: 'SET_SEARCH'; search: string }
	| { type: 'RESET' }
	| { type: 'GO_TO_FIRST' }
	| { type: 'GO_TO_LAST'; lastPage: number }

// Action creators for better type safety
const paginationActions = {
	setPage: (page: number): PaginationAction => ({ type: 'SET_PAGE', page }),
	setSearch: (search: string): PaginationAction => ({
		type: 'SET_SEARCH',
		search,
	}),
	reset: (): PaginationAction => ({ type: 'RESET' }),
	goToFirst: (): PaginationAction => ({ type: 'GO_TO_FIRST' }),
	goToLast: (lastPage: number): PaginationAction => ({
		type: 'GO_TO_LAST',
		lastPage,
	}),
} as const

// Pagination Reducer with better error handling
const paginationReducer = (
	state: PaginationState,
	action: PaginationAction,
): PaginationState => {
	switch (action.type) {
		case 'SET_PAGE':
			return { ...state, currentPage: Math.max(0, action.page) }
		case 'SET_SEARCH':
			return { ...state, search: action.search, currentPage: 0 } // Reset page when searching
		case 'RESET':
			return { currentPage: 0, search: '' }
		case 'GO_TO_FIRST':
			return { ...state, currentPage: 0 }
		case 'GO_TO_LAST':
			return { ...state, currentPage: Math.max(0, action.lastPage) }
		default:
			return state
	}
}

// Custom hooks
const useDebounce = (value: string, delay: number): string => {
	const [debouncedValue, setDebouncedValue] = useState(value)
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		// Clear previous timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}

		timeoutRef.current = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [value, delay])

	return debouncedValue
}

const useDraggable = () => {
	const [draggable, setDraggable] = useState(false)
	const toggleDraggable = useCallback(() => setDraggable((prev) => !prev), [])
	return { draggable, toggleDraggable }
}

// Memoized constants
const STATUS_OPTIONS: StatusOption[] = [
	{ value: 'success', icon: CheckCircle, label: 'Success' },
	{ value: 'failed', icon: XCircle, label: 'Failed' },
	{ value: 'pending', icon: HelpCircle, label: 'Pending' },
] as const

// Cache utilities
const createCacheUpdater = (
	queryClient: ReturnType<typeof useQueryClient>,
	trpc: ReturnType<typeof useTRPC>,
) => ({
	optimisticUpdate: (updatedCommit: Partial<Commit>) => {
		// Use tRPC query key instead of hardcoded key
		const queryKey = trpc.commits.infinite.queryKey()

		queryClient.setQueryData<
			InfiniteData<{ items: Commit[]; nextCursor: Date | null }>
		>(queryKey, (oldData) => {
			if (!oldData?.pages) return oldData

			return {
				...oldData,
				pages: oldData.pages.map((page) => ({
					...page,
					items: page.items.map((commit: Commit) =>
						commit.id === updatedCommit.id
							? { ...commit, ...updatedCommit }
							: commit,
					),
				})),
			}
		})
	},
})

// Main hook
export function useCommits() {
	const queryClient = useQueryClient()
	const trpc = useTRPC()

	const cacheUpdater = useMemo(
		() => createCacheUpdater(queryClient, trpc),
		[queryClient, trpc.commits],
	)

	// State management
	const [paginationState, dispatch] = useReducer(paginationReducer, {
		currentPage: 0,
		search: '',
	})

	const { draggable, toggleDraggable } = useDraggable()
	const debouncedSearch = useDebounce(
		paginationState.search,
		SEARCH_DEBOUNCE_DELAY,
	)

	// Use the correct tRPC pattern for infinite queries
	const infiniteCommitsOptions = trpc.commits.infinite.infiniteQueryOptions(
		{
			cursor: null,
			take: ITEMS_PER_PAGE,
		},
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			getPreviousPageParam: (firstPage) => firstPage.prevCursor,
			trpc: {
				abortOnUnmount: true,
			},
		},
	)

	// Use tRPC for the main query - this is the correct way
	const queryResult = useSuspenseInfiniteQuery(infiniteCommitsOptions)

	// Search query - use a separate query for search results (non-suspense to avoid flash)
	const searchQueryResult = useInfiniteQuery(
		trpc.commits.search.infiniteQueryOptions(
			{
				query: debouncedSearch,
				cursor: null,
				take: ITEMS_PER_PAGE,
			},
			{
				getNextPageParam: (lastPage) => lastPage.nextCursor,
				enabled: !!debouncedSearch.trim(),
				getPreviousPageParam: (firstPage) => firstPage.prevCursor,
			},
		),
	)

	// Determine which query result to use based on search state
	// Only switch to search results when we have actual search data or when loading
	const activeQueryResult =
		debouncedSearch.trim() &&
		(searchQueryResult.data || searchQueryResult.isLoading)
			? searchQueryResult
			: queryResult

	// Update mutation using tRPC
	const updateCommitMutation = useMutation(
		trpc.commits.updateCommit.mutationOptions({
			onMutate: async (variables) => {
				await queryClient.cancelQueries({
					queryKey: trpc.commits.infinite.queryKey(),
				})

				// Snapshot the previous value
				const previousData = queryClient.getQueryData(
					trpc.commits.infinite.queryKey(),
				)

				// Optimistically update to the new value
				if (variables.data) {
					cacheUpdater.optimisticUpdate({
						id: variables.id,
						...variables.data,
					})
				}

				return { previousData }
			},
			onError: (err, _variables, context) => {
				// If the mutation fails, use the context returned from onMutate to roll back
				if (context?.previousData) {
					queryClient.setQueryData(
						trpc.commits.infinite.queryKey(),
						context.previousData,
					)
				}
				toast.error('Failed to update commit', {
					description: err.message || 'There was an error updating the commit.',
				})
			},
			onSuccess: () => {
				toast.success('Commit updated successfully', {
					description: 'The commit has been updated.',
				})
			},
			onSettled: () => {
				// Always refetch after error or success
				queryClient.invalidateQueries({
					queryKey: trpc.commits.infinite.queryKey(),
				})
			},
		}),
	)

	// Computed values with better fallback handling
	const commits = useMemo(() => {
		const data =
			activeQueryResult.data?.pages?.flatMap(
				(page: { items: Commit[] }) => page.items,
			) ?? []

		// If we're searching and have no results yet, show the main query data
		// to prevent flashing empty state
		if (
			debouncedSearch.trim() &&
			data.length === 0 &&
			searchQueryResult.isLoading
		) {
			return (
				queryResult.data?.pages?.flatMap(
					(page: { items: Commit[] }) => page.items,
				) ?? []
			)
		}

		return data
	}, [
		activeQueryResult.data,
		debouncedSearch,
		searchQueryResult.isLoading,
		queryResult.data,
	])

	// Calculate pagination info based on infinite query structure
	const paginationInfo: PaginationInfo = useMemo(() => {
		const pages = activeQueryResult.data?.pages

		if (!pages?.length) {
			return {
				currentPage: 0,
				totalPages: 0,
				total: 0,
				hasNext: false,
				loadedItems: 0,
				pageSize: ITEMS_PER_PAGE,
				loadedPages: 0,
			}
		}

		const totalItems = pages[0]?.total ?? 0
		const estimatedTotalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

		// For infinite queries, we estimate total pages based on loaded data
		// and whether there are more pages available
		const hasMoreData = activeQueryResult.hasNextPage
		const adjustedTotalPages = hasMoreData
			? estimatedTotalPages + 1
			: estimatedTotalPages

		return {
			currentPage: paginationState.currentPage + 1, // Convert to 1-based indexing
			totalPages: Math.max(adjustedTotalPages, paginationState.currentPage + 1),
			total: totalItems,
			hasNext: activeQueryResult.hasNextPage ?? false,
			loadedItems: commits.length,
			pageSize: ITEMS_PER_PAGE,
			loadedPages: pages.length,
		}
	}, [
		activeQueryResult.data?.pages,
		activeQueryResult.hasNextPage,
		commits.length,
		paginationState.currentPage,
	])

	const currentPageData = useMemo(() => {
		// For infinite queries, slice the data based on current page
		const startIndex = paginationState.currentPage * ITEMS_PER_PAGE
		const pageData = commits.slice(startIndex, startIndex + ITEMS_PER_PAGE)

		// If current page is empty but we have commits, reset to first page
		if (
			pageData.length === 0 &&
			commits.length > 0 &&
			paginationState.currentPage > 0
		) {
			// Don't modify state directly here, just return first page data
			return commits.slice(0, ITEMS_PER_PAGE)
		}

		return pageData
	}, [commits, paginationState.currentPage])

	const navigationState = useMemo(
		() => ({
			canPreviousPage: paginationState.currentPage > 0,
			canNextPage: paginationState.currentPage + 1 < paginationInfo.totalPages,
			totalPages: paginationInfo.totalPages,
		}),
		[paginationState.currentPage, paginationInfo.totalPages],
	)

	// Navigation handlers
	const handlePreviousPage = useCallback(() => {
		if (navigationState.canPreviousPage) {
			dispatch(paginationActions.setPage(paginationState.currentPage - 1))
		}
	}, [navigationState.canPreviousPage, paginationState.currentPage])

	const handleNextPage = useCallback(() => {
		if (navigationState.canNextPage) {
			const nextPageStartIndex =
				(paginationState.currentPage + 1) * ITEMS_PER_PAGE

			// If we have enough data for the next page, go to it immediately
			if (nextPageStartIndex < commits.length) {
				dispatch(paginationActions.setPage(paginationState.currentPage + 1))
			}
			// If we need to fetch more data, fetch it first
			else if (
				activeQueryResult.hasNextPage &&
				!activeQueryResult.isFetchingNextPage
			) {
				activeQueryResult.fetchNextPage().then(() => {
					// Only advance page after data is fetched
					dispatch(paginationActions.setPage(paginationState.currentPage + 1))
				})
			}
		}
	}, [
		navigationState.canNextPage,
		paginationState.currentPage,
		activeQueryResult,
		commits.length,
	])

	const handleFirstPage = useCallback(() => {
		dispatch(paginationActions.goToFirst())
	}, [])

	const handleLastPage = useCallback(() => {
		// For infinite queries, we can only go to the last loaded page
		const lastLoadedPageIndex = Math.floor(
			(commits.length - 1) / ITEMS_PER_PAGE,
		)
		dispatch(paginationActions.goToLast(lastLoadedPageIndex))
	}, [commits.length])

	// Other handlers
	const handleReset = useCallback(() => {
		dispatch(paginationActions.reset())
		queryClient.resetQueries({ queryKey: trpc.commits.infinite.queryKey() })
	}, [queryClient, trpc])

	const handleSearch = useCallback((value: string) => {
		dispatch(paginationActions.setSearch(value))
	}, [])

	// Reset page when no commits
	useEffect(() => {
		if (commits.length === 0 && paginationState.currentPage > 0) {
			dispatch(paginationActions.setPage(0))
		}
	}, [commits.length, paginationState.currentPage])

	const handleUpdateCommit = useCallback(
		(changes: Partial<Commit>) => {
			if (!changes.id) {
				toast.error('Commit ID is required for update', {
					description: 'Please provide a valid commit ID.',
				})
				return
			}
			updateCommitMutation.mutate({
				id: changes.id,
				data: changes,
			})
		},
		[updateCommitMutation],
	)

	// Return organized API
	return {
		// State
		draggable,
		currentPage: paginationState.currentPage,
		search: paginationState.search,

		// Data
		currentPageData,
		paginationInfo,
		totalPages: navigationState.totalPages,
		status: STATUS_OPTIONS,

		// Navigation
		canPreviousPage: navigationState.canPreviousPage,
		canNextPage: navigationState.canNextPage,
		handlePreviousPage,
		handleNextPage,
		handleFirstPage,
		handleLastPage,

		// Actions
		handleReset,
		handleSearch,
		handleUpdateCommit,
		toggleDraggable,

		// Query state - handle loading states more gracefully
		isLoading: debouncedSearch.trim()
			? (searchQueryResult.isLoading || searchQueryResult.isFetching) &&
				!searchQueryResult.data
			: (activeQueryResult.isLoading || activeQueryResult.isFetching) &&
				!activeQueryResult.data,
		isFetchingNextPage: activeQueryResult.isFetchingNextPage,
		hasNextPage: activeQueryResult.hasNextPage,
		refetch: activeQueryResult.refetch,

		// Search specific state
		isSearching: !!debouncedSearch.trim() && searchQueryResult.isFetching,

		// Constants
		ITEMS_PER_PAGE,
	} as const
}
