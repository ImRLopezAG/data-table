import { faker } from '@faker-js/faker'
import { z } from 'zod'

export const commitSchema = z.object({
  hash: z.string(),
  message: z.string(),
  date: z.string(),
  status: z.enum(['success', 'failed', 'pending']),
  author: z.string(),
  company: z.string(),
  value: z.number()
})

export type Commit = z.infer<typeof commitSchema>

const fakeCommit = (): Commit => ({
  hash: faker.git.commitSha(),
  message: faker.git.commitMessage(),
  date: faker.date.between({
    from: new Date(2000, 1, 1),
    to: new Date(2025, 1, 1)
  }).toString(),
  status: faker.helpers.arrayElement(['success', 'failed', 'pending']),
  author: faker.person.fullName(),
  company: faker.company.name(),
  value: faker.number.int({ min: 0, max: 1000 }),
})

export const fakeCommits = (count: number) =>
  Array.from({ length: count }, fakeCommit)
