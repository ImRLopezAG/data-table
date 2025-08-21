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

api.get('/r/:name', async ({ req, env }) => {
	try {
		const name = req.param('name')

		if (!name) {
			return new Response('Name is required', { status: 400 })
		}

		const url = new URL(req.url)
		const assetPath = import.meta.env.PROD
			? `assets/${name}.json`
			: `/dist/client/assets/${name}.json`

		url.pathname = assetPath
		const asset = await env.ASSETS.fetch(url.toString())

		if (!asset.ok) {
			return new Response('Component not found', { status: 404 })
		}
		const response = await asset.text()

		return new Response(response, {
			headers: {
				'Content-Type': 'application/json',
			},
		})
	} catch (error) {
		return new Response('Internal Server Error', { status: 500 })
	}
})

export default api
