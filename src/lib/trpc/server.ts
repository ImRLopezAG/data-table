import { createTRPCContext } from '@server/api/trpc'
import { cache } from 'react'

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
export const createContext = cache(async (req: Request) => {
	const heads = new Headers(req.headers)
	heads.set('x-trpc-source', 'rsc')

	return createTRPCContext({
		headers: heads,
	})
})
