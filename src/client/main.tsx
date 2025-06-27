'use client'
import { Toaster } from '@components/ui/sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import React, { Suspense } from 'react'
import { App } from './app'

import './style.css'

export function Bootstrap() {
	const [queryClient] = React.useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: false,
						refetchOnWindowFocus: false,
					},
				},
			}),
	)
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider attribute='class' defaultTheme='system' enableSystem>
					<App />
					<Toaster  richColors position='top-center' />
				</ThemeProvider>
			</QueryClientProvider>
		</Suspense>
	)
}
