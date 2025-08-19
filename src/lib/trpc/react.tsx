'use client'

import { type AppRouter, TRPCProvider } from '@lib/trpc'
import { createQueryClient } from '@lib/trpc/query-client'
import {
	isServer,
	type QueryClient,
	QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
	createTRPCClient,
	createTRPCProxyClient,
	httpBatchStreamLink,
	httpSubscriptionLink,
	loggerLink,
	splitLink,
} from '@trpc/client'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { useState } from 'react'
import SuperJSON from 'superjson'

let clientQueryClientSingleton: QueryClient | undefined

export const getQueryClient = () => {
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
const links = [
	loggerLink({
		enabled: (opts) =>
			process.env.NODE_ENV === 'development' ||
			(opts.direction === 'down' && opts.result instanceof Error),
		colorMode: 'ansi',
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
			headers: async () => {
				const headers =
					typeof document !== 'undefined'
						? new Headers(
								document.cookie.split('; ').reduce((acc, cookie) => {
									const [key, value] = cookie.split('=')
									if (!key || !value) return acc
									acc.set(key, decodeURIComponent(value))
									return acc
								}, new Headers()),
							)
						: new Headers()
				headers.set('x-trpc-source', 'nextjs-react')
				return headers
			},
		}),
	}),
]

export function TRPCReactProvider(props: Props) {
	const queryClient = getQueryClient()

	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links,
		}),
	)

	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				{props.children}
			</TRPCProvider>
			{process.env.NODE_ENV === 'development' && (
				<ReactQueryDevtools initialIsOpen={false} />
			)}
		</QueryClientProvider>
	)
}

export const trpc = {
	proxy: createTRPCOptionsProxy<AppRouter>({
		client: createTRPCProxyClient<AppRouter>({
			links,
		}),
		queryClient: getQueryClient(),
	}),
	client: createTRPCProxyClient<AppRouter>({
		links,
	}),
}

function getBaseUrl() {
	if (typeof window !== 'undefined') return window.location.origin
	if (process.env.URL) return `https://${process.env.URL}`
	return `http://localhost:${process.env.PORT ?? 54}`
}
