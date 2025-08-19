// Remove observable import - no longer needed
// import { observable } from '@trpc/server/observable'
import { EventEmitter, on } from 'node:events'
import { commitsRouter } from '@server/api/routes/commit'
import { todosRouter } from '@server/api/routes/todos'
import {
	createCallerFactory,
	createTRPCRouter,
	publicProcedure,
} from '@/server/api/trpc'

// Create EventEmitter instance for the subscription
const ee = new EventEmitter()

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	todos: todosRouter,
	commits: commitsRouter,
	healthCheck: publicProcedure.query(() => 'yay!'),
	randomNumber: publicProcedure.subscription(async function* (opts) {
		const interval = setInterval(() => {
			ee.emit('randomNumber', Math.random())
		}, 500)

		try {
			// Listen for events using async iteration
			for await (const [data] of on(ee, 'randomNumber', {
				// Pass the AbortSignal to handle cancellation
				signal: opts.signal,
			})) {
				yield data as number
			}
		} finally {
			// Cleanup when subscription ends
			clearInterval(interval)
		}
	}),
})

// ...existing code...
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.user.all();
 *       ^? User[]
 */
export const createCaller = createCallerFactory(appRouter)
