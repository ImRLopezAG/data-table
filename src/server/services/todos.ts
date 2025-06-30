import { type Todo, todoSchema } from '@/server/schemas/todo.schema'
import { rand, randJobTitle, randSentence, randUuid } from '@ngneat/falso'
import { createRepository } from '@server/services/repository'
import { locales } from 'zod/v4'

export const todoRepository = createRepository(todoSchema, {
	entityName: 'Todo',
	defaultPageSize: 25,
	maxPageSize: Number.MAX_SAFE_INTEGER,
	soft: true,
	seeder: Array.from({ length: 1000 }, () => ({
		id: randUuid(),
		title: randJobTitle({ locale: [locales.en] }),
		description: randSentence({ length: 50, locale: [locales.en] }).join(' '),
		status: rand<Todo['status']>([
			'todo',
			'backlog',
			'in-progress',
			'done',
			'canceled',
		]),
		priority: rand<Todo['priority']>(['low', 'medium', 'high']),
		label: rand<Todo['label']>(['bug', 'feature', 'documentation']),
		userId: randUuid(),
	})),
})
