import { z } from 'zod/v4'

export const todoSchema = z.object({
	id: z.string(),
	title: z.string().min(2).max(100),
	description: z.string().max(500).optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	status: z.enum(['todo', 'backlog', 'in-progress', 'done', 'canceled']),
	priority: z.enum(['low', 'medium', 'high']),
	label: z.enum(['bug', 'feature', 'documentation']),
	userId: z.string(),
})
export const todoMutationSchema = todoSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	userId: true,
})

export type Todo = z.infer<typeof todoSchema>
export type TodoMutation = z.infer<typeof todoMutationSchema>
export type TodoPaginated = {
	data: Todo[]
	pagination: Pagination
}