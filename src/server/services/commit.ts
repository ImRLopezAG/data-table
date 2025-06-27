import {
	rand,
	randCompanyName,
	randFullName,
	randGitCommitMessage,
	randGitCommitSha,
	randNumber,
	randPastDate,
	randRecentDate,
	randSoonDate,
	randUuid,
} from '@ngneat/falso'
import { createRepository } from '@server/services/repository'
import { z } from 'zod/v4'

// Clean, schema-first approach - define schema once, everything is inferred
const commitSchema = z.object({
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

// Create schema-based repository - this is the pattern we want!
export const commitRepository = createRepository(commitSchema, {
	entityName: 'Commit',
	defaultPageSize: 25,
	maxPageSize: Number.MAX_SAFE_INTEGER,
	seeder: Array.from({ length: 10_000 }, () => {
		const id = randUuid()
		return {
			id,
			createdAt: randPastDate(),
			updatedAt: randRecentDate(),
			hash: randGitCommitSha(),
			message: randGitCommitMessage(),
			date: randSoonDate().toISOString(),
			status: rand<Commit['status']>(['success', 'failed', 'pending']),
			author: randFullName(),
			company: randCompanyName(),
			value: randNumber({ min: 0, max: 1000 }),
		}
	}),
})
