'use client'
import { Toaster } from '@components/ui/sonner'
import { TRPCReactProvider } from '@lib/trpc/react'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { ThemeProvider } from 'next-themes'
import { StrictMode, Suspense } from 'react'
import { routeTree } from './routeTree.gen'
import './style.css'

// Create a new router instance
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

export function Bootstrap() {
	return (
		<StrictMode>
			<Suspense fallback={<div>Loading...</div>}>
				<ThemeProvider attribute='class' defaultTheme='system'>
					<TRPCReactProvider>
						<RouterProvider router={router} />
						<Toaster richColors position='top-center' />
					</TRPCReactProvider>
				</ThemeProvider>
			</Suspense>
		</StrictMode>
	)
}
