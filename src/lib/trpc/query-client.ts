import { QueryClient as Core, defaultShouldDehydrateQuery as dehydrateCore } from '@tanstack/query-core'
import {
	defaultShouldDehydrateQuery as dehydrateClient,
	QueryClient as Client,
} from '@tanstack/react-query'
import { cache } from 'react'
import SuperJSON from 'superjson'

export const createQueryClient = cache(
	() =>
		new Client({
			defaultOptions: {
				queries: {
					staleTime: 30 * 1000,
				},
				dehydrate: {
					serializeData: SuperJSON.serialize,
					shouldDehydrateQuery: (query) =>
						dehydrateClient(query) ||
						query.state.status === 'pending',
				},
				hydrate: {
					deserializeData: SuperJSON.deserialize,
				},
			},
		}),
)
export const createQueryCoreClient = cache(
	() =>
		new Core({
			defaultOptions: {
				queries: {
					staleTime: 30 * 1000,
				},
				dehydrate: {
					serializeData: SuperJSON.serialize,
					shouldDehydrateQuery: (query) =>
						dehydrateCore(query) ||
						query.state.status === 'pending',
				},
				hydrate: {
					deserializeData: SuperJSON.deserialize,
				},
			},
		}),
)
