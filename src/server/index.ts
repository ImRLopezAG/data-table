import { commitRepository } from '@server/services/commit'
import { Hono } from 'hono'
const api = new Hono<{ Bindings: CloudflareBindings }>()

api.get('/commits', (c) => {
	const { page, pageSize } = c.req.query()
	const commits = commitRepository.findOptimized({
		page: Number(page) || 1,
		pageSize: Number(pageSize) || 25,
		orderBy: 'desc',
	})

	return c.json(commits)
})

api.get('/commits/:id', (c) => {
	const id = c.req.param('id')
	const commit = commitRepository.findById(id)
	if (!commit) {
		return c.notFound()
	}
	return c.json(commit)
})

api.get('/commits/search/', (c) => {
	const { q, page, pageSize } = c.req.query()
	if (!q) {
		return c.json({
			data: [],
			pagination: {
				page: 1,
				pageSize: 25,
				total: 0,
				hasNext: false,
				hasPrev: false,
				currentPage: 1,
			},
		})
	}
	const commits = commitRepository.findMatch(
		{
			author: q,
			company: q,
			message: q,
			hash: q,
		},
		{
			page: Number(page) || 1,
			pageSize: Number(pageSize) || 25,
			orderBy: 'desc',
		},
	)

	return c.json(commits)
})
api.post('/commits', async (c) => {
	const body = await c.req.json()
	const commit = {
		id: crypto.randomUUID(),
		...body,
	}
	commitRepository.create(commit)
	return c.json(commit, 201)
})

api.put('/commits/:id', async (c) => {
	const id = c.req.param('id')
	const commit = commitRepository.findById(id)

	if (!commit) {
		return c.notFound()
	}
	const body = await c.req.json()
	const updatedCommit = {
		...commit,
		...body,
	}
	commitRepository.update(id, updatedCommit)
	return c.json(updatedCommit)
})

api.delete('/commits/:id', (c) => {
	const id = c.req.param('id')
	const commit = commitRepository.findById(id)
	if (!commit) {
		return c.notFound()
	}
	commitRepository.delete(id)
	return c.json({ message: 'Commit deleted' })
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
			: `dist/client/assets/${name}.json`

		url.pathname = assetPath
		console.log(`Fetching asset from: ${url.toString()}`)
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
		console.log(`unexpected error fetching asset:  ${req.url}`, error)
		return new Response('Internal Server Error', { status: 500 })
	}
})

export default api
