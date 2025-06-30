'use client'

import { createQueryClient } from '@lib/trpc/query-client'
import {
	type QueryClient,
	QueryClientProvider,
	isServer,
} from '@tanstack/react-query'
import { createTRPCClient, httpBatchStreamLink, httpSubscriptionLink, loggerLink, splitLink } from '@trpc/client'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { useState } from 'react'
import SuperJSON from 'superjson'

import { type AppRouter, TRPCProvider } from '@lib/trpc'
let clientQueryClientSingleton: QueryClient | undefined = undefined
const getQueryClient = () => {
	if (isServer) return createQueryClient()
	// Browser: use singleton pattern to keep the same query client
	clientQueryClientSingleton ??= createQueryClient()

	return clientQueryClientSingleton
}

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>

export function TRPCReactProvider(props: Props) {
	const queryClient = getQueryClient()

	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links: [
				loggerLink({
					enabled: (op) =>
						process.env.NODE_ENV === 'development' ||
						(op.direction === 'down' && op.result instanceof Error),
				}),
				splitLink({
					// Use the httpBatchStreamLink for queries and mutations
					condition: (op) => op.type === 'subscription',
					true: httpSubscriptionLink({
						url: `${getBaseUrl()}/api/trpc`,
						transformer: SuperJSON,
					}),
					false: httpBatchStreamLink({
						transformer: SuperJSON,
						url: `${getBaseUrl()}/api/trpc`,
						headers: () => {
							const headers = new Headers()
							headers.set('x-trpc-source', 'nextjs-react')
							return headers
						},
					}),
				}),
			],
		}),
	)

	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				{props.children}
			</TRPCProvider>
		</QueryClientProvider>
	)
}

function getBaseUrl() {
	if (typeof window !== 'undefined') return window.location.origin
	if (process.env.URL) return `https://${process.env.URL}`
	return `http://localhost:${process.env.PORT ?? 54}`
}
