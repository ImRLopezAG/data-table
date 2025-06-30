import { createContext } from '@lib/trpc/server'
import { appRouter } from '@server/api/root'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { Hono } from 'hono'
const api = new Hono<{ Bindings: CloudflareBindings }>()

api.use('/trpc/*', (c) => {
	const req = c.req.raw
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req,
		router: appRouter,
		createContext: () => createContext(req),
		onError: import.meta.env.DEV
			? ({ path, error }) => {
					const { code, message, cause } = error
					console.error(
						`❌ tRPC failed on ${path ?? '<no-path>'}: ${code} - ${cause}`,
					)
					return {
						status: 500,
						body: {
							error: {
								code,
								message,
								cause: cause instanceof Error ? cause.message : cause,
							},
						},
					}
				}
			: undefined,
		allowMethodOverride: true,
		allowBatching: true,
	})
})

export default api
