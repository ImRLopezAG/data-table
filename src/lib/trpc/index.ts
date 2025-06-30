import type { AppRouter } from '@/server/api/root'
import { createTRPCContext } from '@trpc/tanstack-react-query'

export const { TRPCProvider, useTRPC, useTRPCClient } =
	createTRPCContext<AppRouter>()

export {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
	useSuspenseInfiniteQuery,
} from '@tanstack/react-query'
export type { AppRouter }
export { useSubscription } from "@trpc/tanstack-react-query";
export { skipToken } from '@tanstack/react-query';
