import { type Commit, fakeCommits } from '@/services/commit'
import { Hono } from 'hono'
// import { McpIntegration } from './mcp';
// export { McpIntegration };
const api = new Hono<{ Bindings: CloudflareBindings }>()
const commits = new Map<string, Commit>()

api.get('/commits', (c) => {
	const count = c.req.query('count')
	if (commits.size === 0) {
		for (const commit of fakeCommits(count ? Number(count) : 100)) {
			commits.set(commit.hash, commit)
		}
	}

	const limit = count ? Number(count) : 100
	const commitArray = Array.from(commits.values()).slice(0, limit)
	return c.json({ data: commitArray })
})

api.get('/commits/:id', (c) => {
	const id = c.req.param('id')
	const commit = commits.get(id)
	if (!commit) {
		return c.notFound()
	}
	return c.json(commit)
})

api.post('/commits', async (c) => {
	const body = await c.req.json()
	const commit = {
		id: crypto.randomUUID(),
		...body,
	}
	commits.set(commit.id, commit)
	return c.json(commit, 201)
})

api.put('/commits/:id', async (c) => {
	const id = c.req.param('id')
	const commit = commits.get(id)
	console.log({
		message: 'Updating commit',
		id,
		size: commits.size,
	})
	if (!commit) {
		return c.notFound()
	}
	const body = await c.req.json()
	const updatedCommit = {
		...commit,
		...body,
	}
	commits.set(id, updatedCommit)
	return c.json(updatedCommit)
})

api.delete('/commits/:id', (c) => {
	const id = c.req.param('id')
	const commit = commits.get(id)
	if (!commit) {
		return c.notFound()
	}
	commits.delete(id)
	return c.json({ message: 'Commit deleted' })
})

api.get('/r/:name', async ({ req, env }) => {
	const name = req.param('name')

	if (!name) {
		return new Response('Name is required', { status: 400 })
	}

	const url = new URL(req.url)
	const assetPath = import.meta.env.PROD
		? `assets/${name}.json`
		: `dist/client/assets/${name}.json`
	url.pathname = assetPath
	const assetRequest = new Request(url)
	const asset = await env.ASSETS.fetch(assetRequest)

	if (!asset.ok) {
		return new Response('Component not found', { status: 404 })
	}
	const response = await asset.text()
	console.log('Response from asset:', response)
	try {
		const json = JSON.parse(response)
		return new Response(JSON.stringify(json), {
			headers: {
				'Content-Type': 'application/json',
			},
		})
	} catch (error) {
		console.error('Error parsing JSON:', error)
	}
	return new Response(response, {
		headers: {
			'Content-Type': 'application/json',
		},
	})
})

// api.mount("/mcp", McpIntegration.serve('/api/mcp').fetch, {
// 	replaceRequest(originalRequest) {
// 		return new Request(originalRequest)
// 	},
// });

export default api
