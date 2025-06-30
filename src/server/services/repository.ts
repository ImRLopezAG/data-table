
import type { z } from 'zod/v4'

export interface SchemaRepositoryOptions<T extends z.ZodTypeAny> {
	defaultPageSize?: number
	maxPageSize?: number
	entityName?: string
	soft?: boolean
	seeder?: Array<z.infer<T>>
}

/**
 * Create a type-safe repository directly from a Zod schema
 *
 * Usage:
 * const userRepo = createSchemaRepository(userSchema, { entityName: 'User' })
 *
 * This enables the pattern: createGenericController(userRepo, { schema: userSchema })
 */
export function createRepository<
	E extends Record<string, z.ZodTypeAny>,
	TSelect extends SelectSchemaType<E> = SelectSchemaType<E>,
>(
	schema: TSelect,
	opts: SchemaRepositoryOptions<TSelect> = {},
): SchemaRepository<E, TSelect> {
	const {
		defaultPageSize = 50,
		maxPageSize = 1000,
		entityName = 'Entity',
		soft = false,
	} = opts

	// Create schemas for validation
	const insertSchema = schema.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	const updateSchema = schema
		.partial()
		.omit({ id: true, createdAt: true, updatedAt: true })

	// In-memory storage
	const db = new Map()

	// Populate with seeder data if provided
	if (opts.seeder) {
		for (const item of opts.seeder) {
			// @ts-ignore
			const { id } = item
			
			if (id) {
				db.set(id, item)
			}
		}
	}

	const generatePaginatedResult = <T>(
		data: readonly T[],
		page: number,
		pageSize: number,
	): PaginatedResult<T> => {
		const total = data.length
		const hasNext = page * pageSize < total
		const hasPrev = page > 1
		const currentPage = page

		return {
			data: data.slice((page - 1) * pageSize, page * pageSize),
			pagination: {
				pageSize,
				total,
				hasNext,
				hasPrev,
				currentPage,
				page,

			},
		}
	}

	const repository: SchemaRepository<E, TSelect, z.infer<TSelect>> = {
		findAll: (opts = {}) => {
			const { page = 1, pageSize = defaultPageSize, orderBy = 'desc' } = opts
			const results = Array.from(db.values())

			// Sort by createdAt and id
			results.sort((a, b) => {
				const aRecord = a as Record<string, unknown>
				const bRecord = b as Record<string, unknown>
				const aCreatedAt = (aRecord.createdAt as Date)?.getTime() || 0
				const bCreatedAt = (bRecord.createdAt as Date)?.getTime() || 0
				const aId = (aRecord.id as string) || ''
				const bId = (bRecord.id as string) || ''

				if (orderBy === 'desc') {
					if (bCreatedAt !== aCreatedAt) return bCreatedAt - aCreatedAt
					return bId.localeCompare(aId)
				}

				if (aCreatedAt !== bCreatedAt) return aCreatedAt - bCreatedAt
				return aId.localeCompare(bId)
			})

			// Pagination
			const actualPageSize = Math.min(pageSize, maxPageSize)
			const startIndex = Math.max(0, page - 1) * actualPageSize
			const data = schema
				.array()
				.parse(results.slice(startIndex, startIndex + actualPageSize))
			return data
		},

		findById: (id: string) => {
			const search = db.get(id)
			if (!search) return null
			const results = schema.parse(search)
			return results
		},

		create: (data, hooks) => {
			try {
				// Validate insert data
				const validatedData = insertSchema.parse(data)

				// Generate ID and timestamps
				const id = crypto.randomUUID()
				const now = new Date()

				// Create full record
				const newRecord = {
					...validatedData,
					id,
					createdAt: now,
					updatedAt: now,
				} as unknown as TSelect

				// Validate against full schema
				const result = schema.parse(newRecord)

				// Store
				db.set(id, newRecord)
				if (hooks?.onCompleteBeforeReturn) {
					hooks.onCompleteBeforeReturn(result)
				}

				return [null, result]
			} catch (error) {
				if (hooks?.onError) {
					hooks.onError(error instanceof Error ? error : new Error(String(error)))
				}
				return [
					error instanceof Error ? error : new Error(String(error)),
					null,
				] as [Error, null]
			}
		},

		update: (id: string, data, hooks) => {
			try {
				const existing = db.get(id)
				if (!existing) {
					return [new Error(`${entityName} with id ${id} not found`), null] as [
						Error,
						null,
					]
				}

				// Validate update data
				const validatedData = updateSchema.parse(data)

				// Create updated record
				const updatedRecord = {
					...existing,
					...validatedData,
					updatedAt: new Date(),
				} as TSelect

				// Validate against full schema
				const result = schema.parse(updatedRecord)

				// Store
				db.set(id, updatedRecord)
				if (hooks?.onCompleteBeforeReturn) {
					hooks.onCompleteBeforeReturn(result)
				}
				return [null, result]
			} catch (error) {
				if (hooks?.onError) {
					hooks.onError(error instanceof Error ? error : new Error(String(error)))
				}
				return [
					error instanceof Error ? error : new Error(String(error)),
					null,
				] as [Error, null]
			}
		},

		delete: (id: string, hooks?) => {
			try {
				const existing = db.get(id)
				if (!existing) {
					return {
						success: false,
						message: `${entityName} with id ${id} not found`,
					}
				}

				if (
					soft &&
					existing &&
					typeof existing === 'object' &&
					'active' in existing
				) {
					// Soft delete
					const updated = {
						...existing,
						active: false,
						updatedAt: new Date(),
					} as TSelect
					db.set(id, updated)
				} else {
					// Hard delete
					db.delete(id)
				}
				
				if (hooks?.onCompleteBeforeReturn) {
					hooks.onCompleteBeforeReturn(schema.parse(existing))
				}
				return { success: true }
			} catch (error) {
				if (hooks?.onError) {
					hooks.onError(error instanceof Error ? error : new Error(String(error)))
				}
				return { success: false, message: String(error) }
			}
		},

		findBy: (criteria, opts) => {
			const { page = 1, pageSize = defaultPageSize } = opts || {}
			const results = schema.array().parse(
				Array.from(db.values()).filter((item) => {
					return Object.entries(criteria).every(([key, value]) => {
						const itemRecord = item as Record<string, unknown>
						const itemValue = itemRecord[key]
						if (typeof itemValue === 'string' && typeof value === 'string') {
							return itemValue.toLowerCase().includes(value.toLowerCase())
						}
						return itemValue === value
					})
				}),
			)

			return generatePaginatedResult(results, page, pageSize)
		},

		findMatch: (criteria, opts) => {
			const { page = 1, pageSize = defaultPageSize } = opts || {}
			const results = schema.array().parse(
				Array.from(db.values()).filter((item) => {
					return Object.entries(criteria).some(([key, value]) => {
						const itemRecord = item as Record<string, unknown>
						const itemValue = itemRecord[key]

						// Handle string partial matching (case-insensitive)
						if (typeof itemValue === 'string' && typeof value === 'string') {
							return itemValue.toLowerCase().includes(value.toLowerCase())
						}

						// Handle exact matching for non-strings
						return itemValue === value
					})
				}),
			)
			return generatePaginatedResult(results, page, pageSize)
		},

		findByIds: (ids: readonly string[], opts?) => {
			const { page = 1, pageSize = defaultPageSize } = opts || {}
			const results = schema.array().parse(
				Array.from(db.values()).filter((item) => {
					const itemRecord = item as Record<string, unknown>
					return ids.includes(itemRecord.id as string)
				}),
			)
			return generatePaginatedResult(results, page, pageSize)
		},

		count: (criteria?) => {
			if (!criteria) return db.size
			const results = repository.findBy(criteria)
			return results.data.length
		},

		findOptimized: (options = {}) => {
			const { page = 1, pageSize = defaultPageSize } = options
			const actualPageSize = Math.min(pageSize, maxPageSize)

			// Get all results for total count
			const allResults = repository.findAll({
				...options,
				page: 1,
				pageSize: Number.MAX_SAFE_INTEGER,
			})
			const total = allResults.length

			// Get paginated results
			const data = repository.findAll(options)
			return {
				data,
				pagination: {
					page,
					pageSize: actualPageSize,
					total,
					hasNext: page * actualPageSize < total,
					hasPrev: page > 1,
					currentPage: page,
				},
			}
		},
		withCursor: (cursor, options = {}) => {
			const { page = 1, pageSize = defaultPageSize } = options
			const actualPageSize = Math.min(pageSize, maxPageSize)
			const results = Array.from(db.values()).filter((item) => {
				const itemRecord = item as Record<string, unknown>
				const itemDate = itemRecord.createdAt as Date
				return !cursor || itemDate > cursor
			})
			const startIndex = (page - 1) * actualPageSize
			const paginatedData = results.slice(startIndex, startIndex + actualPageSize)
			const nextCursor = paginatedData.length > 0
				? (paginatedData[paginatedData.length - 1] as Record<string, unknown>).createdAt as Date
				: null	
			const data = schema.array().parse(paginatedData)
			return {
				items: data,
				nextCursor,
			}
		},
		findByWithCursor: (criteria, cursor, options = {}) => {
			const { page = 1, pageSize = defaultPageSize } = options
			const actualPageSize = Math.min(pageSize, maxPageSize)
			const results = Array.from(db.values()).filter((item) => {
				const itemRecord = item as Record<string, unknown>
				const itemDate = itemRecord.createdAt as Date
				return (!cursor || itemDate > cursor) &&
					Object.entries(criteria).every(([key, value]) => {
						const itemValue = itemRecord[key]
						if (typeof itemValue === 'string' && typeof value === 'string') {
							return itemValue.toLowerCase().includes(value.toLowerCase())
						}
						return itemValue === value
					})
			})
			const startIndex = (page - 1) * actualPageSize
			const paginatedData = results.slice(startIndex, startIndex + actualPageSize)
			const nextCursor = paginatedData.length > 0
				? (paginatedData[paginatedData.length - 1] as Record<string, unknown>).createdAt as Date
				: null
			const data = schema.array().parse(paginatedData)
			return {
				items: data,
				nextCursor,
			}
		},
		findMatchWithCursor: (criteria, cursor, options = {}) => {
			const { page = 1, pageSize = defaultPageSize } = options
			const actualPageSize = Math.min(pageSize, maxPageSize)
			const results = Array.from(db.values()).filter((item) => {
				const itemRecord = item as Record<string, unknown>
				const itemDate = itemRecord.createdAt as Date
				return (!cursor || itemDate > cursor) &&
					Object.entries(criteria).some(([key, value]) => {
						const itemValue = itemRecord[key]
						if (typeof itemValue === 'string' && typeof value === 'string') {
							return itemValue.toLowerCase().includes(value.toLowerCase())
						}
						return itemValue === value
					})
			})
			const startIndex = (page - 1) * actualPageSize
			const paginatedData = results.slice(startIndex, startIndex + actualPageSize)
			const nextCursor = paginatedData.length > 0
				? (paginatedData[paginatedData.length - 1] as Record<string, unknown>).createdAt as Date
				: null
			const data = schema.array().parse(paginatedData)
			return {
				items: data,
				nextCursor,
			}
		},	
		db,
		entityName,
	}

	return repository
}
