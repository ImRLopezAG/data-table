import { reactRenderer } from '@hono/react-renderer'
import { Hono } from 'hono'
import { Link, ReactRefresh, Script } from 'vite-ssr-components/react'

export const client = new Hono()

client.get(
	'*',
	reactRenderer(
		({ title }) => {
			const isDev = import.meta.env.DEV
			console.log(
				`Rendering page with title: ${title} in ${isDev ? 'development' : 'production'} mode`,
			)
			return (
				<html lang='en' suppressHydrationWarning>
					<head>
						<title>{title}</title>
						<meta charSet='utf-8' />
						<meta
							name='viewport'
							content='width=device-width, initial-scale=1'
						/>
						{isDev && <Link rel='stylesheet' href='/src/client/style.css' />}
						{!isDev && <link rel='stylesheet' href='/index.css' />}
						<ReactRefresh />
					</head>
					<body>
						<div id='root' />
						{isDev && (
							<Script src='/src/client/index.tsx' type='module' async />
						)}
						{!isDev && <script src='/index.js' type='module' async />}
					</body>
				</html>
			)
		},
		{
			stream: true,
		},
	),
)

client.get('/', (c) => {
	return c.render(<div>Loading...</div>, {
		title: 'Components App',
	})
})

export default client
