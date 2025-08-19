import { z } from 'zod/v4'

// Clean, schema-first approach - define schema once, everything is inferred
export const commitSchema = z.object({
	id: z.string(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	hash: z.string(),
	message: z.string(),
	date: z.string(),
	status: z.enum(['success', 'failed', 'pending']),
	author: z.string(),
	company: z.string(),
	value: z.number(),
})
export const commitMutationSchema = commitSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
})

export type Commit = z.infer<typeof commitSchema>
export type CommitPaginated = {
	data: Commit[]
	pagination: {
		page: number
		pageSize: number
		total: number
		hasNext: boolean
		hasPrev: boolean
		currentPage: number
	}
}

export type CursorCommit = {
	items: Commit[]
	nextCursor: Date | null
}
