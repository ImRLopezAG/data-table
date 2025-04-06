import { useQuery, useQueryClient } from '@tanstack/react-query'
export function createGlobalState<T>(
	queryKey: unknown,
	initialData: T | null = null,
) {
	return () => {
		const queryClient = useQueryClient()

		const { data } = useQuery({
			queryKey: [queryKey],
			queryFn: () => Promise.resolve(initialData),
			refetchInterval: false,
			refetchOnMount: false,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			refetchIntervalInBackground: false,
		})

		function setData(data: Partial<T>) {
			queryClient.setQueryData([queryKey], data)
		}

		function refetch() {
			queryClient.invalidateQueries({
				queryKey: [queryKey],
			})
			queryClient.refetchQueries({
				queryKey: [queryKey],
			})
		}

		return { data, setData, refetch }
	}
}
