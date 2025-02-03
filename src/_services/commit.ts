import { faker } from '@faker-js/faker'

export interface Commit {
  hash: string
  message: string
  date: string
  status: 'success' | 'failed' | 'pending'
  author: string
  company: string
}

const fakeCommit = (): Commit => ({
  hash: faker.git.commitSha(),
  message: faker.git.commitMessage(),
  date: faker.git.commitDate(),
  status: faker.helpers.shuffle(['success', 'failed', 'pending'])[0],
  author: faker.person.fullName(),
  company: faker.company.name()
})

export const fakeCommits = (count: number) =>
  Array.from({ length: count }, fakeCommit)
