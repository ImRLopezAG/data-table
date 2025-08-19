import { createRoute, type RouteConfig } from '@hono/zod-openapi'
import { z } from 'zod'

export const errorSchema = (defaultMessage = 'Internal Server Error') =>
	z.object({ error: z.string().default(defaultMessage) })

export const responseSchema = (
	description: string,
	schema: z.ZodTypeAny | undefined = undefined,
) => {
	if (!schema) {
		return {
			description,
		}
	}

	return {
		description,
		content: {
			'application/json': {
				schema,
			},
		},
	}
}

// Common response schemas for standard HTTP status codes
export const commonResponses = {
	400: responseSchema('BAD_REQUEST', errorSchema('BAD REQUEST')),
	401: responseSchema('UNAUTHORIZED', errorSchema('UNAUTHORIZED')),
	403: responseSchema('FORBIDDEN', errorSchema('FORBIDDEN')),
	404: responseSchema('NOT_FOUND', errorSchema('NOT FOUND')),
	500: responseSchema(
		'INTERNAL_SERVER_ERROR',
		errorSchema('INTERNAL SERVER ERROR'),
	),
}

// Security configuration for protected routes
export const defaultSecurity = [{ bearerAuth: [] }]

export function createOpenApiGenericRoutes<
	T extends Record<string, RouteConfig>,
>(
	entitySchema: z.ZodObject<z.ZodRawShape>,
	entityName: string,
	customRoutes: T = {} as T,
) {
	// Standard CRUD operations
	const standardRoutes = {
		// Get all entities
		getAllRoute: createRoute({
			method: 'get',
			path: '/list',
			name: `Get ${entityName} list`,
			description: `Returns list of ${entityName}`,
			summary: `Get ${entityName} list`,
			tags: [entityName],
			security: defaultSecurity,
			responses: {
				200: responseSchema(
					'OK',
					z.object({
						data: z.array(entitySchema),
					}),
				),
				...commonResponses,
			},
		}),

		// Get entity by ID
		getByIdRoute: createRoute({
			method: 'get',
			path: '/byId/{id}',
			name: `Get ${entityName} by ID`,
			description: `Returns ${entityName} by ID`,
			summary: `Get ${entityName} by ID`,
			tags: [entityName],
			security: defaultSecurity,
			request: {
				params: z.object({
					id: z.string(),
				}),
			},
			responses: {
				200: responseSchema('OK', entitySchema),
				...commonResponses,
			},
		}),

		// Create entity
		createRoute: createRoute({
			method: 'post',
			path: '/create',
			name: `Create ${entityName}`,
			description: `Creates a new ${entityName}`,
			summary: `Create ${entityName}`,
			tags: [entityName],
			security: defaultSecurity,
			request: {
				body: {
					content: {
						'application/json': {
							schema: entitySchema.omit({
								id: true,
								createdAt: true,
								updatedAt: true,
							}),
						},
					},
				},
			},
			responses: {
				201: responseSchema('CREATED', entitySchema),
				...commonResponses,
			},
		}),

		// Update entity
		updateRoute: createRoute({
			method: 'put',
			path: '/update/{id}',
			name: `Update ${entityName}`,
			description: `Updates a ${entityName}`,
			summary: `Update ${entityName}`,
			tags: [entityName],
			security: defaultSecurity,
			request: {
				params: z.object({
					id: z.string(),
				}),
				body: {
					content: {
						'application/json': {
							schema: entitySchema.omit({ id: true, createdAt: true }),
						},
					},
				},
			},
			responses: {
				200: responseSchema('OK', entitySchema),
				...commonResponses,
			},
		}),

		// Delete entity
		deleteRoute: createRoute({
			method: 'delete',
			path: '/delete/{id}',
			name: `Delete ${entityName}`,
			description: `Deletes a ${entityName}`,
			summary: `Delete ${entityName}`,
			tags: [entityName],
			security: defaultSecurity,
			request: {
				params: z.object({
					id: z.string(),
				}),
			},
			responses: {
				202: responseSchema('ACCEPTED', z.object({ message: z.string() })),
				...commonResponses,
			},
		}),
	} as const

	// Process custom routes
	const processedCustomRoutes = Object.entries(customRoutes).reduce(
		(acc, [key, routeConfig]) => {
			acc[key as keyof T] = createRoute({
				...routeConfig,
				responses: {
					...routeConfig.responses,
					// Add common error responses if not explicitly defined
					...(routeConfig.responses[400] ? {} : { 400: commonResponses[400] }),
					...(routeConfig.responses[401] ? {} : { 401: commonResponses[401] }),
					...(routeConfig.responses[403] ? {} : { 403: commonResponses[403] }),
					...(routeConfig.responses[500] ? {} : { 500: commonResponses[500] }),
				},
			})
			return acc
		},
		{} as Record<keyof T, ReturnType<typeof createRoute>>,
	)

	return {
		...standardRoutes,
		...processedCustomRoutes,
	} as typeof standardRoutes & Record<keyof T, ReturnType<typeof createRoute>>
}
