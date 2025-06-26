import type { Commit, CommitPaginated } from '@/services/commit'
import {
	type InfiniteData,
	useMutation,
	useQueryClient,
	useSuspenseInfiniteQuery,
} from '@tanstack/react-query'
import { CheckCircle, HelpCircle, XCircle } from 'lucide-react'
import React from 'react'

const COMMIT_KEY = 'commits'
const ITEMS_PER_PAGE = 20

export function useCommits() {
	const queryClient = useQueryClient()
	const [draggable, setDraggable] = React.useState(false)
	const [testLoading, setTestLoading] = React.useState(false)
	const [currentPage, setCurrentPage] = React.useState(0)
	const [search, setSearch] = React.useState('')

	const { data, isLoading, hasNextPage, isFetchingNextPage, refetch } =
		useSuspenseInfiniteQuery<CommitPaginated>({
			queryKey: [COMMIT_KEY],
			queryFn: ({ pageParam = 1 }) =>
				fetch(`/api/commits?page=${pageParam}&pageSize=${ITEMS_PER_PAGE}`).then(
					(res) => res.json(),
				),
			getNextPageParam: (lastPage) => {
				return lastPage.pagination.hasNext
					? lastPage.pagination.page + 1
					: undefined
			},
			initialPageParam: 1,
		})

	const commits = React.useMemo(() => {
		if (!data?.pages?.length) return []
		return data.pages.flatMap((page) => page.data)
	}, [data])

	const paginationInfo = React.useMemo(() => {
		if (!data?.pages?.length) return null

		const pageWithMaxTotal = data.pages.reduce((maxPage, currentPage) => {
			if (!maxPage) return currentPage
			return currentPage.pagination.total >= maxPage.pagination.total
				? currentPage
				: maxPage
		}, data.pages[0])

		if (!pageWithMaxTotal)
			return {
				currentPage: 0,
				totalPages: 0,
				total: 0,
				hasNext: false,
				loadedItems: 0,
				pageSize: ITEMS_PER_PAGE,
				loadedPages: 0,
			}
		return {
			currentPage: pageWithMaxTotal.pagination.page,
			totalPages: Math.ceil(pageWithMaxTotal.pagination.total / ITEMS_PER_PAGE),
			total: pageWithMaxTotal.pagination.total,
			hasNext: pageWithMaxTotal.pagination.hasNext,
			loadedItems: commits.length,
			pageSize: ITEMS_PER_PAGE,
			loadedPages: data.pages.length,
		}
	}, [data, commits.length])

	// Calculate current page data
	const currentPageData = React.useMemo(() => {
		// For direct page access (like jumping to last page), find the specific page
		const targetPageNumber = currentPage + 1 // Convert to 1-based
		const targetPage = data?.pages?.find(
			(page) => page.pagination.page === targetPageNumber,
		)

		if (targetPage) {
			return targetPage.data
		}

		// Fallback to slice method for sequential pages
		const startIndex = currentPage * ITEMS_PER_PAGE
		const endIndex = startIndex + ITEMS_PER_PAGE
		return commits.slice(startIndex, endIndex)
	}, [commits, currentPage, data?.pages])

	// Pagination handlers
	const handlePreviousPage = React.useCallback(async () => {
		if (currentPage > 0) {
			const previousPageIndex = currentPage - 1
			const previousPageNumber = previousPageIndex + 1 // Convert to 1-based

			// Check if we already have the previous page loaded
			const previousPageExists = data?.pages?.some(
				(page) => page.pagination.page === previousPageNumber,
			)

			if (!previousPageExists) {
				// Fetch the previous page directly
				try {
					const response = await fetch(
						`/api/commits?page=${previousPageNumber}&pageSize=${ITEMS_PER_PAGE}`,
					)
					const previousPageData = await response.json()

					// Add the previous page to the cache
					queryClient.setQueryData<InfiniteData<CommitPaginated>>(
						[COMMIT_KEY],
						(oldData) => {
							if (!oldData?.pages) return oldData

							return {
								...oldData,
								pages: [
									...oldData.pages,
									previousPageData,
								] as CommitPaginated[],
								pageParams: [...(oldData.pageParams || []), previousPageNumber],
							}
						},
					)
				} catch (error) {
					console.error('Failed to fetch previous page:', error)
					return
				}
			}

			setCurrentPage(previousPageIndex)
		}
	}, [currentPage, data?.pages, queryClient])

	const handleNextPage = React.useCallback(async () => {
		const nextPageIndex = currentPage + 1
		const nextPageNumber = nextPageIndex + 1 // Convert to 1-based

		// Check if we already have the next page loaded
		const nextPageExists = data?.pages?.some(
			(page) => page.pagination.page === nextPageNumber,
		)

		if (!nextPageExists) {
			// Check if this page exists (we might have reached the end)
			if (
				paginationInfo &&
				nextPageNumber > Math.ceil(paginationInfo.total / ITEMS_PER_PAGE)
			) {
				return // Can't go beyond the last page
			}

			// Fetch the next page directly
			try {
				const response = await fetch(
					`/api/commits?page=${nextPageNumber}&pageSize=${ITEMS_PER_PAGE}`,
				)
				const nextPageData = await response.json()

				// Add the next page to the cache
				queryClient.setQueryData<InfiniteData<CommitPaginated>>(
					[COMMIT_KEY],
					(oldData) => {
						if (!oldData?.pages) return oldData

						return {
							...oldData,
							pages: [...oldData.pages, nextPageData] as CommitPaginated[],
							pageParams: [...(oldData.pageParams || []), nextPageNumber],
						}
					},
				)
			} catch (error) {
				console.error('Failed to fetch next page:', error)
				return
			}
		}

		setCurrentPage(nextPageIndex)
	}, [currentPage, data?.pages, queryClient, paginationInfo])

	const handleFirstPage = React.useCallback(async () => {
		// Check if we already have the first page loaded
		const firstPageExists = data?.pages?.some(
			(page) => page.pagination.page === 1,
		)

		if (!firstPageExists) {
			// Fetch the first page directly
			try {
				const response = await fetch(
					`/api/commits?page=1&pageSize=${ITEMS_PER_PAGE}`,
				)
				const firstPageData = await response.json()

				// Add the first page to the cache
				queryClient.setQueryData<InfiniteData<CommitPaginated>>(
					[COMMIT_KEY],
					(oldData) => {
						if (!oldData?.pages) return oldData

						return {
							...oldData,
							pages: [...oldData.pages, firstPageData] as CommitPaginated[],
							pageParams: [...(oldData.pageParams || []), 1],
						}
					},
				)
			} catch (error) {
				console.error('Failed to fetch first page:', error)
				return
			}
		}

		setCurrentPage(0)
	}, [data?.pages, queryClient])

	const handleLastPage = React.useCallback(async () => {
		if (!paginationInfo) return

		// Calculate the last page number (1-based)
		const lastPageNumber = Math.ceil(paginationInfo.total / ITEMS_PER_PAGE)
		const lastPageIndex = lastPageNumber - 1 // Convert to 0-based index

		// Check if we already have the last page loaded
		const lastPageExists = data?.pages?.some(
			(page) => page.pagination.page === lastPageNumber,
		)

		if (!lastPageExists) {
			// Fetch only the last page directly
			try {
				const response = await fetch(
					`/api/commits?page=${lastPageNumber}&pageSize=${ITEMS_PER_PAGE}`,
				)
				const lastPageData = await response.json()

				// Add the last page to the cache without affecting existing pages
				queryClient.setQueryData<InfiniteData<CommitPaginated>>(
					[COMMIT_KEY],
					(oldData) => {
						if (!oldData?.pages) return oldData

						return {
							...oldData,
							pages: [...oldData.pages, lastPageData] as CommitPaginated[],
							pageParams: [...(oldData.pageParams || []), lastPageNumber],
						}
					},
				)
			} catch (error) {
				console.error('Failed to fetch last page:', error)
				return
			}
		}

		// Set current page to the last page
		setCurrentPage(lastPageIndex)
	}, [paginationInfo, data?.pages, queryClient])

	// Reset current page when data is reset
	React.useEffect(() => {
		if (commits.length === 0) {
			setCurrentPage(0)
		}
	}, [commits.length])

	// Pagination state calculations
	const canPreviousPage = currentPage > 0
	const canNextPage = React.useMemo(() => {
		if (!paginationInfo) return false
		const nextPageNumber = currentPage + 2 // Convert to 1-based for next page
		const totalPages = Math.ceil(paginationInfo.total / ITEMS_PER_PAGE)
		return nextPageNumber <= totalPages
	}, [currentPage, paginationInfo])

	const totalPages = React.useMemo(() => {
		if (!paginationInfo) return 0
		return Math.ceil(paginationInfo.total / ITEMS_PER_PAGE)
	}, [paginationInfo])

	// Memoize toggle function
	const toggleDraggable = React.useCallback(
		() => setDraggable((prev) => !prev),
		[],
	)

	// Memoize test loading function
	const triggerTestLoading = React.useCallback(() => {
		setTestLoading(true)
		setTimeout(() => setTestLoading(false), 3000)
	}, [])

	const updateCommit = useMutation({
		mutationFn: async (commit: Partial<Commit>) => {
			const response = await fetch(`/api/commits/${commit.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(commit),
			})
			if (!response.ok) {
				throw new Error('Failed to update commit')
			}
			const responseData = await response.json()
			return responseData as Commit
		},
		// Optimistic update for infinite query structure
		async onMutate(newCommit) {
			await queryClient.cancelQueries({ queryKey: [COMMIT_KEY] })

			const previousData = queryClient.getQueryData<
				InfiniteData<CommitPaginated>
			>([COMMIT_KEY])

			queryClient.setQueryData<InfiniteData<CommitPaginated>>(
				[COMMIT_KEY],
				(oldData) => {
					if (!oldData?.pages) return oldData

					return {
						...oldData,
						pages: oldData.pages.map((page: CommitPaginated) => ({
							...page,
							data: page.data.map((commit: Commit) =>
								commit.id === newCommit.id
									? { ...commit, ...newCommit }
									: commit,
							),
						})),
					}
				},
			)

			return { previousData }
		},
		onError: (_err, _newCommit, context) => {
			if (context?.previousData) {
				queryClient.setQueryData([COMMIT_KEY], context.previousData)
			}
		},
	})

	const status = React.useMemo(
		() =>
			['success', 'failed', 'pending'].map((value) => ({
				value,
				icon:
					value === 'success'
						? CheckCircle
						: value === 'failed'
							? XCircle
							: HelpCircle,
				label: value.charAt(0).toUpperCase() + value.slice(1),
			})),
		[],
	)

	const handleReset = React.useCallback(() => {
		setCurrentPage(0)
		setSearch('') // Clear the search state
		queryClient.resetQueries({ queryKey: [COMMIT_KEY] })
	}, [queryClient])

	//  DebounceQuery search query

	const debouncedQ = useDebounce(search, 500)

	React.useEffect(() => {
		async function handleSearchChange() {
			if (!debouncedQ) {
				// If search is cleared, refetch the original data
				queryClient.invalidateQueries({ queryKey: [COMMIT_KEY] })
				return
			}

			try {
				const response: CommitPaginated = await fetch(
					`/api/commits/search/?q=${debouncedQ}&page=1&pageSize=${ITEMS_PER_PAGE}`,
				).then((res) => res.json())

				// Replace the cache with the actual search results from the API
				queryClient.setQueryData<InfiniteData<CommitPaginated>>(
					[COMMIT_KEY],
					(oldData) => {
						if (!oldData?.pages || !response) return oldData

						// Replace the first page with search results and clear other pages
						const searchPage: CommitPaginated = {
							data: response.data || [],
							pagination: response.pagination || {
								page: 1,
								pageSize: ITEMS_PER_PAGE,
								total: response.data?.length || 0,
								hasNext: false,
								hasPrev: false,
								currentPage: 1,
							},
						}

						return {
							...oldData,
							pages: [searchPage],
							pageParams: [undefined], // Reset page params to match the single page
						}
					},
				)

				console.log('Search results:', response)
			} catch (error) {
				console.error('Search failed:', error)
			}
		}

		handleSearchChange()
	}, [debouncedQ, queryClient])

	const handleSearch = React.useCallback((value: string) => {
		setSearch(value)
	}, [])

	return {
		draggable,
		testLoading,
		currentPage,
		paginationInfo,
		canPreviousPage,
		canNextPage,
		totalPages,
		status,
		handlePreviousPage,
		handleNextPage,
		handleFirstPage,
		handleLastPage,
		handleReset,
		updateCommit,
		triggerTestLoading,
		toggleDraggable,
		isLoading,
		isFetchingNextPage,
		refetch,
		currentPageData,
		hasNextPage,
		ITEMS_PER_PAGE,
		search,
		handleSearch,
	}
}

function useDebounce(value: string, delay: number) {
	const [debouncedValue, setDebouncedValue] = React.useState(value)

	React.useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}
