import { faker } from '@faker-js/faker'
import { createSchemaRepository } from '@server/repository'
import { z } from 'zod'

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
export const commitRepository = createSchemaRepository(commitSchema, {
	entityName: 'Commit',
	defaultPageSize: 25,
	maxPageSize: Number.MAX_SAFE_INTEGER,
	seeder: Array.from({ length: 1_000 }, () => {
		const id = faker.string.uuid()
		return {
			id,
			createdAt: faker.date.past(),
			updatedAt: faker.date.recent(),
			hash: faker.git.commitSha(),
			message: faker.git.commitMessage(),
			date: faker.date.anytime().toISOString(),
			status: faker.helpers.arrayElement(['success', 'failed', 'pending']),
			author: faker.person.fullName(),
			company: faker.company.name(),
			value: faker.number.int({ min: 0, max: 1000 }),
		}
	}),
})
