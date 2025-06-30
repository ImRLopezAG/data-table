import EventEmitter, { on } from 'node:events'
import { createTRPCRouter, publicProcedure } from '@server/api/trpc'
import {
	type Commit,
	commitMutationSchema,
} from '@server/schemas/commit.schema'
import { commitRepository } from '@server/services/commit'
import { TRPCError, tracked } from '@trpc/server'
import { z } from 'zod/v4'

type CommitEventMap = {
	mutate: [commit: Commit]
	delete: [id: string]
}

class CommitEventEmitter extends EventEmitter<CommitEventMap> {
	toIterable<TEventName extends keyof CommitEventMap & string>(
		eventName: TEventName,
		opts?: NonNullable<Parameters<typeof on>[2]>,
	): AsyncIterable<CommitEventMap[TEventName]> {
		return on(this, eventName, opts) as AsyncIterable<
			CommitEventMap[TEventName]
		>
	}
}
export const commitEmitter = new CommitEventEmitter()

export const commitsRouter = createTRPCRouter({
	getCommits: publicProcedure.subscription(async function* ({ signal }) {
		const data = commitRepository.findAll()
		for (const commit of data) {
			yield tracked(commit.id, commit)
		}
		for await (const [commit] of commitEmitter.toIterable('mutate', { signal }))
			yield tracked(commit.id, commit)
	}),
	createCommit: publicProcedure
		.input(commitMutationSchema)
		.mutation(async ({ input }) => {
			const parsed = commitMutationSchema.safeParse(input)
			if (!parsed.success)
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Invalid input data',
					cause: parsed.error.issues.map((issue) => issue.message).join(', '),
				})
			return commitRepository.create(parsed.data, {
				onCompleteBeforeReturn: (result) => {
					commitEmitter.emit('mutate', result)
				},
				onError: (error) => {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: error.message,
					})
				},
			})
		}),
	updateCommit: publicProcedure
		.input(
			z.object({
				id: z.string(),
				data: commitMutationSchema.partial(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id, data } = input
			const parsed = commitMutationSchema.partial().safeParse(data)
			if (!parsed.success)
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Invalid input data',
					cause: parsed.error.issues.map((issue) => issue.message).join(', '),
				})
			return commitRepository.update(id, parsed.data, {
				onCompleteBeforeReturn: (result) => {
					commitEmitter.emit('mutate', result)
				},
				onError: (error) => {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: error.message,
					})
				},
			})
		}),
	deleteCommit: publicProcedure
		.input(z.string())
		.mutation(async ({ input }) => {
			const id = input
			return commitRepository.delete(id, {
				onCompleteBeforeReturn: () => {
					commitEmitter.emit('delete', id)
				},
				onError: (error) => {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: error.message,
					})
				},
			})
		}),
	infinite: publicProcedure
		.input(
			z.object({
				take: z.number().min(1).max(200).default(10),
				cursor: z.date().nullish(),
			}),
		)
		.query(async ({ input }) => {
			return commitRepository.withCursor(input.cursor ?? null, {
				pageSize: input.take,
				orderBy: 'desc',
			})
		}),
	search: publicProcedure
		.input(
			z.object({
				query: z.string(),
				take: z.number().min(1).max(200).default(10),
				cursor: z.date().nullish(),
			}),
		)
		.query(async ({ input }) => {
			const { query, take, cursor } = input
			return commitRepository.findMatchWithCursor(
				{
					author: query,
					company: query,
					hash: query,
					message: query,
				},
				cursor ?? null,
				{
					pageSize: take,
					orderBy: 'desc',
				},
			)
		}),
	getCommitById: publicProcedure.input(z.string()).query(async ({ input }) => {
		const id = input
		const commit = commitRepository.findById(id)
		if (!commit) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: `Commit with id ${id} not found`,
			})
		}
		return commit
	}),
	getCommitByHash: publicProcedure
		.input(z.string())
		.query(async ({ input }) => {
			const hash = input
			const commit = commitRepository.findBy({ hash })
			if (!commit) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: `Commit with hash ${hash} not found`,
				})
			}
			return commit
		}),
	getCommitByAuthor: publicProcedure
		.input(z.string())
		.query(async ({ input }) => {
			const author = input
			const commits = commitRepository.findBy({ author })
			if (!commits) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: `No commits found for author ${author}`,
				})
			}
			return commits
		}),
})

// infinite: publicProcedure
// 		.input(
// 			z.object({
// 				channelId: z.string().uuid(),
// 				cursor: z.date().nullish(),
// 				take: z.number().min(1).max(50).nullish(),
// 			}),
// 		)
// 		.query(async (opts) => {
// 			const take = opts.input.take ?? 20
// 			const cursor = opts.input.cursor

// 			const page = await opts.ctx.db.query.posts.findMany({
// 				orderBy: (fields, ops) => ops.desc(fields.createdAt),
// 				where: (fields, ops) =>
// 					ops.and(
// 						ops.eq(fields.channelId, opts.input.channelId),
// 						cursor ? ops.lte(fields.createdAt, cursor) : undefined,
// 					),
// 				limit: take + 1,
// 			})

// 			const items = page.reverse()
// 			let nextCursor: typeof cursor | null = null
// 			if (items.length > take) {
// 				const prev = items.shift()
// 				// biome-ignore lint/style/noNonNullAssertion: <explanation>
// 				nextCursor = prev!.createdAt
// 			}
// 			return {
// 				items,
// 				nextCursor,
// 			}
// 		}),
