'use client'
import { Toaster } from '@components/ui/sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import React, { StrictMode, Suspense } from 'react'
import { App } from './app'

import './style.css'
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
			refetchOnWindowFocus: false,
		},
	},
})
export function Bootstrap() {
	return (
		<StrictMode>
			<Suspense fallback={<div>Loading...</div>}>
				<QueryClientProvider client={queryClient}>
					<ThemeProvider attribute='class' defaultTheme='system' enableSystem>
						<App />
						<Toaster richColors position='top-center' />
					</ThemeProvider>
				</QueryClientProvider>
			</Suspense>
		</StrictMode>
	)
}
