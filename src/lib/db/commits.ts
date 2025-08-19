import { createQueryCoreClient } from '@lib/trpc/query-client'
import { trpc } from '@lib/trpc/react'
import { createCollection, createLiveQueryCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { toast } from 'sonner'

export const commitCollection = createCollection(
	queryCollectionOptions({
		queryClient: createQueryCoreClient(),
		queryKey: trpc.proxy.commits.list.queryKey(),
		getKey: ({ id }) => id,
		queryFn: async () => await trpc.client.commits.list.query(),
		onUpdate: async ({ transaction }) => {
			const updates = transaction.mutations.map((m) => ({
				id: m.key,
				...m.changes,
			}))
			for await (const update of updates) {
				await trpc.client.commits.updateCommit.mutate({
					id: update.id,
					data: {
						...update,
					},
				})
				toast.success('Commit updated successfully')
			}
		},
		onInsert: async ({ transaction }) => {
			const inserts = transaction.mutations.map((m) => m.modified)
			for await (const insert of inserts) {
				await trpc.client.commits.createCommit.mutate({ ...insert })
			}
		},
		onDelete: async ({ transaction }) => {
			const deletes = transaction.mutations.map((m) => m.key)
			for await (const id of deletes) {
				await trpc.client.commits.deleteCommit.mutate(id)
			}
		},
	}),
)
export const commitsLiveCollection = createLiveQueryCollection({
	query: (q) =>
		q
			.from({ commits: commitCollection })
			.select(({ commits }) => ({ ...commits })),
	getKey: ({ id }) => id,

	onUpdate: async ({ transaction }) => {
		const updates = transaction.mutations.map((m) => ({
			id: m.key,
			...m.changes,
		}))
		for (const update of updates) {
			commitCollection.update(update.id, (draft) => {
				Object.assign(draft, update)
			})
		}
	},
	onInsert: async ({ transaction }) => {
		const inserts = transaction.mutations.map((m) => m.modified)
		for await (const insert of inserts) {
			commitCollection.insert(insert)
		}
	},
	onDelete: async ({ transaction }) => {
		const deletes = transaction.mutations.map((m) => m.key)
		for await (const id of deletes) {
			commitCollection.delete(id)
		}
	},
	utils: {
		search: async (query: string) => {
			return await trpc.client.commits.search.query({ query })
		},
	},
})
