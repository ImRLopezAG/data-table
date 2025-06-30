import { type Commit, commitSchema } from '@server/schemas/commit.schema'
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
