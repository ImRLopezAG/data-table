import { fetcher } from '@lib/fetcher'
import type { Commit, CommitPaginated } from '@server/services/commit'
import {
	type InfiniteData,
	useMutation,
	useQueryClient,
	useSuspenseInfiniteQuery,
} from '@tanstack/react-query'
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

// Constants
const COMMIT_KEY = 'commits' as const
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

type NavigationDirection = 'first' | 'previous' | 'next' | 'last'

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

const EMPTY_PAGINATION_RESPONSE: CommitPaginated = {
	data: [],
	pagination: {
		page: 1,
		pageSize: ITEMS_PER_PAGE,
		total: 0,
		hasNext: false,
		hasPrev: false,
		currentPage: 1,
	},
} as const

const EMPTY_PAGINATION_INFO: PaginationInfo = {
	currentPage: 0,
	totalPages: 0,
	total: 0,
	hasNext: false,
	loadedItems: 0,
	pageSize: ITEMS_PER_PAGE,
	loadedPages: 0,
} as const

// API functions with better error handling
const apiClient = {
	fetchCommits: async (
		page: unknown,
		signal?: AbortSignal,
	): Promise<CommitPaginated> => {
		const [error, data] = await fetcher<CommitPaginated>(
			`/api/commits?page=${page}&pageSize=${ITEMS_PER_PAGE}`,
			{ signal },
		)
		if (error) {
			// Don't log or show toast for abort errors - they're intentional cancellations
			if (error.name === 'AbortError' || signal?.aborted) {
				throw error // Re-throw abort errors so React Query can handle them properly
			}
			console.error('Failed to fetch commits:', error)
			toast.error('Failed to fetch commits', {
				description: error.message || 'There was an error fetching commits.',
			})
			return EMPTY_PAGINATION_RESPONSE
		}
		return data
	},

	searchCommits: async (
		query: string,
		signal?: AbortSignal,
	): Promise<CommitPaginated> => {
		const [error, data] = await fetcher<CommitPaginated>(
			`/api/commits/search/?q=${encodeURIComponent(query)}&page=1&pageSize=${ITEMS_PER_PAGE}`,
			{ signal },
		)
		if (error) {
			// Don't log or show toast for abort errors - they're intentional cancellations
			if (error.name === 'AbortError' || signal?.aborted) {
				throw error // Re-throw abort errors so React Query can handle them properly
			}
			console.error('Failed to search commits:', error)
			toast.error('Failed to search commits', {
				description:
					error.message || 'There was an error searching for commits.',
			})
			return EMPTY_PAGINATION_RESPONSE
		}
		return data
	},
	updateCommit: async (
		commit: Partial<Commit>,
		signal?: AbortSignal,
	): Promise<Commit> => {
		const [error, data] = await fetcher<Commit>(`/api/commits/${commit.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(commit),
			signal,
		})
		if (error) {
			// Don't log or show toast for abort errors - they're intentional cancellations
			if (error.name === 'AbortError' || signal?.aborted) {
				throw error // Re-throw abort errors so React Query can handle them properly
			}
			console.error('Failed to update commit:', error)
			toast.error('Failed to update commit', {
				description: error.message || 'There was an error updating the commit.',
			})
			throw new Error(`Failed to update commit: ${error.message}`)
		}
		return data
	},
}

// Cache utilities
const createCacheUpdater = (
	queryClient: ReturnType<typeof useQueryClient>,
) => ({
	addPage: (pageData: CommitPaginated, pageNumber: number) => {
		queryClient.setQueryData<InfiniteData<CommitPaginated>>(
			[COMMIT_KEY],
			(oldData) => {
				if (!oldData?.pages) return oldData

				// Avoid duplicate pages
				const pageExists = oldData.pages.some(
					(page) => page.pagination.page === pageNumber,
				)

				if (pageExists) return oldData

				return {
					...oldData,
					pages: [...oldData.pages, pageData],
					pageParams: [...(oldData.pageParams || []), pageNumber],
				}
			},
		)
	},

	replaceWithSearchResults: (searchResults: CommitPaginated) => {
		queryClient.setQueryData<InfiniteData<CommitPaginated>>(
			[COMMIT_KEY],
			(oldData) => {
				if (!oldData?.pages) return oldData

				return {
					...oldData,
					pages: [searchResults],
					pageParams: [undefined],
				}
			},
		)
	},

	optimisticUpdate: (updatedCommit: Partial<Commit>) => {
		queryClient.setQueryData<InfiniteData<CommitPaginated>>(
			[COMMIT_KEY],
			(oldData) => {
				if (!oldData?.pages) return oldData

				return {
					...oldData,
					pages: oldData.pages.map((page) => ({
						...page,
						data: page.data.map((commit) =>
							commit.id === updatedCommit.id
								? { ...commit, ...updatedCommit }
								: commit,
						),
					})),
				}
			},
		)
	},
})

// Main hook
export function useCommits() {
	const queryClient = useQueryClient()
	const cacheUpdater = useMemo(
		() => createCacheUpdater(queryClient),
		[queryClient],
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

	// Main query
	const queryResult = useSuspenseInfiniteQuery<CommitPaginated>({
		queryKey: [COMMIT_KEY],
		queryFn: async ({ pageParam = 1, signal }) =>
			apiClient.fetchCommits(pageParam, signal),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
		initialPageParam: 1,
	})

	// Computed values
	const commits = useMemo(
		() => queryResult.data?.pages?.flatMap((page) => page.data) ?? [],
		[queryResult.data],
	)

	const paginationInfo: PaginationInfo = useMemo(() => {
		const pages = queryResult.data?.pages

		if (!pages?.length) return EMPTY_PAGINATION_INFO

		// Find the page with the most accurate total count (usually the latest)
		const mostRecentPage = pages[pages.length - 1]
		if (!mostRecentPage || !mostRecentPage.pagination)
			return EMPTY_PAGINATION_INFO

		const totalItems = mostRecentPage.pagination.total
		const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

		return {
			currentPage: paginationState.currentPage + 1, // Convert to 1-based indexing
			totalPages,
			total: totalItems,
			hasNext: paginationState.currentPage + 1 < totalPages,
			loadedItems: commits.length,
			pageSize: ITEMS_PER_PAGE,
			loadedPages: pages.length,
		}
	}, [queryResult.data?.pages, commits.length, paginationState.currentPage])

	const currentPageData = useMemo(() => {
		const targetPageNumber = paginationState.currentPage + 1
		const targetPage = queryResult.data?.pages?.find(
			(page) => page.pagination.page === targetPageNumber,
		)

		if (targetPage) return targetPage.data

		// Fallback to slice method
		const startIndex = paginationState.currentPage * ITEMS_PER_PAGE
		return commits.slice(startIndex, startIndex + ITEMS_PER_PAGE)
	}, [commits, paginationState.currentPage, queryResult.data?.pages])

	const navigationState = useMemo(
		() => ({
			canPreviousPage: paginationState.currentPage > 0,
			canNextPage: paginationState.currentPage + 2 <= paginationInfo.totalPages,
			totalPages: paginationInfo.totalPages,
		}),
		[paginationState.currentPage, paginationInfo.totalPages],
	)

	// Generic page fetching with caching
	const fetchAndCachePage = useCallback(
		async (pageNumber: number) => {
			const pageExists = queryResult.data?.pages?.some(
				(page) => page.pagination.page === pageNumber,
			)

			if (pageExists) return

			try {
				const pageData = await apiClient.fetchCommits(pageNumber)
				cacheUpdater.addPage(pageData, pageNumber)
			} catch (error) {
				// Don't log abort errors as they're intentional cancellations
				if (error instanceof Error && error.name !== 'AbortError') {
					toast.error('Failed to fetch page', {
						description:
							error.message || 'There was an error fetching the page.',
					})
					console.error(`Failed to fetch page ${pageNumber}:`, error)
				}
				throw error
			}
		},
		[queryResult.data?.pages, cacheUpdater],
	)

	// Navigation handlers with unified error handling
	const createNavigationHandler = useCallback(
		(
			direction: NavigationDirection,
			getPageInfo: () => { pageNumber: number; pageIndex: number } | null,
		) => {
			return async () => {
				const pageInfo = getPageInfo()
				if (!pageInfo) return

				try {
					await fetchAndCachePage(pageInfo.pageNumber)

					switch (direction) {
						case 'first':
							dispatch(paginationActions.goToFirst())
							break
						case 'last':
							dispatch(paginationActions.goToLast(pageInfo.pageIndex))
							break
						default:
							dispatch(paginationActions.setPage(pageInfo.pageIndex))
					}
				} catch (error) {
					// Don't log abort errors as they're intentional cancellations
					if (error instanceof Error && error.name !== 'AbortError') {
						console.error(`Navigation to ${direction} failed:`, error)
					}
				}
			}
		},
		[fetchAndCachePage],
	)

	// Navigation handlers
	const handlePreviousPage = createNavigationHandler('previous', () => {
		if (!navigationState.canPreviousPage) return null
		const pageIndex = paginationState.currentPage - 1
		return { pageIndex, pageNumber: pageIndex + 1 }
	})

	const handleNextPage = createNavigationHandler('next', () => {
		if (!navigationState.canNextPage) return null
		const pageIndex = paginationState.currentPage + 1
		return { pageIndex, pageNumber: pageIndex + 1 }
	})

	const handleFirstPage = createNavigationHandler('first', () => ({
		pageIndex: 0,
		pageNumber: 1,
	}))

	const handleLastPage = createNavigationHandler('last', () => ({
		pageIndex: navigationState.totalPages - 1,
		pageNumber: navigationState.totalPages,
	}))

	// Other handlers
	const handleReset = useCallback(() => {
		dispatch(paginationActions.reset())
		queryClient.resetQueries({ queryKey: [COMMIT_KEY] })
	}, [queryClient])

	const handleSearch = useCallback((value: string) => {
		dispatch(paginationActions.setSearch(value))
	}, [])

	// Search effect with cleanup
	useEffect(() => {
		const controller = new AbortController()

		const performSearch = async () => {
			if (!debouncedSearch.trim()) {
				queryClient.invalidateQueries({ queryKey: [COMMIT_KEY] })
				return
			}

			try {
				const searchResults = await apiClient.searchCommits(
					debouncedSearch,
					controller.signal,
				)

				if (controller.signal.aborted) return

				const searchPage: CommitPaginated = {
					data: searchResults.data || [],
					pagination: searchResults.pagination || {
						page: 1,
						pageSize: ITEMS_PER_PAGE,
						total: searchResults.data?.length || 0,
						hasNext: false,
						hasPrev: false,
						currentPage: 1,
					},
				}

				cacheUpdater.replaceWithSearchResults(searchPage)
			} catch (error) {
				if (!controller.signal.aborted) {
					console.error('Search failed:', error)
					toast.error('Failed to search commits', {
						description: 'There was an error searching for commits.',
					})
				}
			}
		}

		performSearch()

		return () => controller.abort()
	}, [debouncedSearch, queryClient, cacheUpdater])

	// Reset page when no commits
	useEffect(() => {
		if (commits.length === 0 && paginationState.currentPage > 0) {
			dispatch(paginationActions.setPage(0))
		}
	}, [commits.length, paginationState.currentPage])

	// Update mutation with optimistic updates
	const updateCommit = useMutation({
		mutationFn: apiClient.updateCommit,
		async onMutate(newCommit) {
			await queryClient.cancelQueries({ queryKey: [COMMIT_KEY] })

			const previousData = queryClient.getQueryData<
				InfiniteData<CommitPaginated>
			>([COMMIT_KEY])

			cacheUpdater.optimisticUpdate(newCommit)

			return { previousData }
		},
		onError: (_err, _newCommit, context) => {
			if (context?.previousData) {
				queryClient.setQueryData([COMMIT_KEY], context.previousData)
			}
			toast.error('Failed to update commit', {
				description: 'There was an error updating the commit.',
			})
		},
		onSuccess: () => {
			toast.success('Commit updated successfully', {
				description: 'The commit has been updated.',
			})
		},
	})

	const handleUpdateCommit = useCallback((changes: Partial<Commit>) => {
		if (!changes.id) {
			toast.error('Commit ID is required for update', {
				description: 'Please provide a valid commit ID.',
			})
			return
		}
		updateCommit.mutate(changes)
	}, [])

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

		// Query state
		isLoading: queryResult.isLoading,
		isFetchingNextPage: queryResult.isFetchingNextPage,
		hasNextPage: queryResult.hasNextPage,
		refetch: queryResult.refetch,

		// Constants
		ITEMS_PER_PAGE,
	} as const
}
