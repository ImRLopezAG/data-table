import { cloudflare } from '@cloudflare/vite-plugin'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import compiler from 'babel-plugin-react-compiler'
import Million from '@million/lint'
const ReactCompilerConfig = {
  target: '19' // '17' | '18' | '19'
};

export default defineConfig(({ command, mode, isSsrBuild }) => {
	const isDev = command === 'serve' && mode === 'development'

	return {
		build: {
			target: 'esnext',
			rollupOptions: {
				external: isDev ? [] : ['cloudflare:workers', 'cloudflare'],
				treeshake: !isSsrBuild,
				input: !isSsrBuild ? './src/client/index.tsx' : undefined,
				output: !isSsrBuild
					? {
							format: 'es',
							entryFileNames: '[name].js',
							chunkFileNames: '[name].js',
							assetFileNames: '[name].[ext]',
						}
					: undefined,
			},
			cssMinify: !isSsrBuild ? 'lightningcss' : undefined,
			minify: !isDev && !isSsrBuild,
		},
		ssr: {
			external: ['cloudflare:workers', 'cloudflare'],
			target: !isDev ? 'webworker' : undefined,
			noExternal: isDev ? undefined : true,
		},
		optimizeDeps: {
			include: !isSsrBuild
				? ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime']
				: undefined,
			force: isSsrBuild,
		},
		css: !isSsrBuild
			? {
					transformer: 'lightningcss',
				}
			: undefined,
		plugins: [
			!isSsrBuild && react({
				babel: {
					// plugins: [[compiler, ReactCompilerConfig]],
				},
			}),
			!isSsrBuild && tailwindcss(),
			cloudflare(),
			viteTsConfigPaths(),
			!isSsrBuild &&
				isDev &&
				devServer({
					adapter,
					entry: './src/index.ts',
				}),
			isSsrBuild && ssrPlugin(),
		].filter(Boolean),
	}
})
