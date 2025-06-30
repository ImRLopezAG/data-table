import EventEmitter, { on } from 'node:events'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import {
	type Todo,
	todoMutationSchema,
	todoSchema,
} from '@server/schemas/todo.schema'
import { todoRepository } from '@server/services/todos'
import { TRPCError, tracked } from '@trpc/server'
import { z } from 'zod/v4'
type TodoEventMap = {
	mutate: [todo: Todo]
	delete: [id: string]
}

class TodoEventEmitter extends EventEmitter<TodoEventMap> {
	toIterable<TEventName extends keyof TodoEventMap & string>(
		eventName: TEventName,
		opts?: NonNullable<Parameters<typeof on>[2]>,
	): AsyncIterable<TodoEventMap[TEventName]> {
		return on(this, eventName, opts) as AsyncIterable<TodoEventMap[TEventName]>
	}
}

export const todoEmitter = new TodoEventEmitter()

export const todosRouter = createTRPCRouter({
	getTodos: publicProcedure.subscription(async function* ({ signal }) {
		const data = todoRepository.findAll()
		for (const todo of data) {
			yield tracked(todo.id, todo)
		}
		for await (const [todo] of todoEmitter.toIterable('mutate', { signal }))
			yield tracked(todo.id, todo)
	}),
	createTodo: publicProcedure
		.input(todoMutationSchema)
		.mutation(async ({ input }) => {
			const parsed = todoMutationSchema.safeParse(input)
			if (!parsed.success)
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Invalid input data',
					cause: parsed.error.issues.map((issue) => issue.message).join(', '),
				})
			return todoRepository.create(parsed.data, {
				onCompleteBeforeReturn: (result) => {
					todoEmitter.emit('mutate', result)
				},
				onError: (error) => {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: error.message,
					})
				},
			})
		}),
	updateTodo: publicProcedure
		.input(
			z.object({
				id: z.string(),
				data: todoMutationSchema.partial(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id, data } = input
			const parsed = todoMutationSchema.partial().safeParse(data)
			if (!parsed.success)
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Invalid input data',
					cause: parsed.error.issues.map((issue) => issue.message).join(', '),
				})
			return todoRepository.update(id, parsed.data, {
				onCompleteBeforeReturn: (result) => {
					todoEmitter.emit('mutate', result)
				},
				onError: (error) => {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: error.message,
					})
				},
			})
		}),
	deleteTodo: publicProcedure.input(z.string()).mutation(async ({ input }) => {
		return todoRepository.delete(input, {
			onCompleteBeforeReturn: (_result) => {
				todoEmitter.emit('delete', input)
			},
			onError: (error) => {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error.message,
				})
			},
		})
	}),
	getTodoById: publicProcedure.input(z.string()).query(async ({ input }) => {
		const todo = todoRepository.findById(input)
		if (!todo) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: `Todo with id ${input} not found`,
			})
		}
		return todo
	}),
	infinite: publicProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
				orderBy: z.enum(['asc', 'desc']).default('asc'),
			}),
		)
		.query(async ({ input }) => {
			return todoRepository.findOptimized({
				page: input.page,
				pageSize: input.pageSize,
				orderBy: input.orderBy,
			})
		}),
	search: publicProcedure
		.input(
			z.object({
				query: z.string().min(1),
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
			}),
		)
		.query(async ({ input }) => {
			const { query, page, pageSize } = input
			return todoRepository.findMatch(
				{
					title: query,
					description: query,
				},
				{
					page,
					pageSize,
				},
			)
		}),
	toggleTodoStatus: publicProcedure
		.input(
			z.object({
				id: z.string(),
				status: todoSchema.shape.status,
			}),
		)
		.mutation(async ({ input }) => {
			const { id, status } = input
			return todoRepository.update(
				id,
				{ status },
				{
					onCompleteBeforeReturn: (result) => {
						todoEmitter.emit('mutate', result)
					},
					onError: (error) => {
						throw new TRPCError({
							code: 'INTERNAL_SERVER_ERROR',
							message: error.message,
						})
					},
				},
			)
		}),
	toggleTodoPriority: publicProcedure
		.input(
			z.object({
				id: z.string(),
				priority: todoSchema.shape.priority,
			}),
		)
		.mutation(async ({ input }) => {
			const { id, priority } = input
			return todoRepository.update(
				id,
				{ priority },
				{
					onCompleteBeforeReturn: (result) => {
						todoEmitter.emit('mutate', result)
					},
					onError: (error) => {
						throw new TRPCError({
							code: 'INTERNAL_SERVER_ERROR',
							message: error.message,
						})
					},
				},
			)
		}),
})
