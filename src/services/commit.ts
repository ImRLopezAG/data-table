import { faker } from '@faker-js/faker'

export interface Commit {
  hash: string
  message: string
  date: string
  status: 'success' | 'failed' | 'pending'
  author: string
  company: string
  value: number
}

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
