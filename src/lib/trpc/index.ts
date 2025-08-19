import { createTRPCContext } from '@trpc/tanstack-react-query'
import type { AppRouter } from '@/server/api/root'

export const { TRPCProvider, useTRPC, useTRPCClient } =
	createTRPCContext<AppRouter>()

export {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
} from '@tanstack/react-query'
export type { AppRouter }
export { skipToken } from '@tanstack/react-query'
export { useSubscription } from '@trpc/tanstack-react-query'
