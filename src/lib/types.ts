import type { z } from 'zod/v4'
declare module '@hono/react-renderer' {
	interface Props {
		title: string
	}
}

interface RepositoryMethodsHooks<T> {
	onCompleteBeforeReturn?: (data: T) => void
	onError?: (error: Error) => void
}

declare global {

	interface Props {
		children?: React.ReactNode
		className?: string
	}
	interface Pagination {
		page: number
		pageSize: number
		total: number
		hasNext: boolean
		hasPrev: boolean
		currentPage: number

		nextCursor?: Date | null
	}

	export interface PaginatedResult<T> {
		data: readonly T[]
		pagination: Pagination
	}

	interface PaginationOptions {
		page?: number
		pageSize?: number
		orderBy?: 'asc' | 'desc'
	}

	type BaseSelectSchema = {
		id: z.ZodString
		createdAt: z.ZodOptional<z.ZodDate>
		updatedAt: z.ZodOptional<z.ZodDate>
	}

	export type SelectSchemaType<T extends Record<string, z.ZodTypeAny>> =
		z.ZodObject<T & BaseSelectSchema>
	export type TInsert<
		T extends Record<string, z.ZodTypeAny>,
		TSelect extends SelectSchemaType<T> = SelectSchemaType<T>,
		Entity extends z.infer<TSelect> = z.infer<TSelect>,
	> = Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>

	export type TUpdate<
		T extends Record<string, z.ZodTypeAny>,
		TSelect extends SelectSchemaType<T> = SelectSchemaType<T>,
		Entity extends z.infer<TSelect> = z.infer<TSelect>,
	> = Partial<Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>>
	export interface SchemaRepository<
		T extends Record<string, z.ZodTypeAny>,
		TSelect extends SelectSchemaType<T> = SelectSchemaType<T>,
		Entity extends z.infer<TSelect> = z.infer<TSelect>,
	> {
		// Core CRUD operations
		findAll: (opts?: PaginationOptions) => Entity[]
		findById: (id: string) => Entity | null
		create: (data: TInsert<T>, hooks?: RepositoryMethodsHooks<Entity>) => [Error, null] | [null, Entity]
		update: (id: string, data: TUpdate<T>, hooks?: RepositoryMethodsHooks<Entity>) => [Error, null] | [null, Entity]
		delete: (id: string, hooks?: RepositoryMethodsHooks<Entity>) => { success: boolean; message?: string }

		// Query operations
		findBy: (
			criteria: Partial<Entity>,
			opts?: PaginationOptions,
		) => PaginatedResult<Entity>
		findMatch: (
			criteria: Partial<Entity>,
			opts?: PaginationOptions,
		) => PaginatedResult<Entity>
		findByIds: (
			ids: readonly string[],
			opts?: PaginationOptions,
		) => PaginatedResult<Entity>
		count: (criteria?: Partial<Entity>) => number

		// Advanced operations
		findOptimized: (options?: PaginationOptions) => PaginatedResult<Entity>

		withCursor: (
			cursor: Date | null,
			options?: PaginationOptions,
		) => {
			items: Entity[]
			nextCursor: Date | null
		}
		findByWithCursor: (
			criteria: Partial<Entity>,
			cursor: Date | null,
			options?: PaginationOptions,
		) => {
			items: Entity[]
			nextCursor: Date | null
		}
		findMatchWithCursor: (
			criteria: Partial<Entity>,
			cursor: Date | null,
			options?: PaginationOptions,
		) => {
			items: Entity[]
			nextCursor: Date | null
		}
		// Access to underlying storage and metadata
		db: Map<string, z.infer<TSelect>>
		entityName: string
	}
}
