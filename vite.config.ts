import { cloudflare } from "@cloudflare/vite-plugin";
import build from "@hono/vite-build/cloudflare-workers";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import ssrHotReload from "vite-plugin-ssr-hot-reload";
import viteTsConfigPaths from "vite-tsconfig-paths";
export default defineConfig(({ command, isSsrBuild }) => {
	if (command === "serve") {
		return {
			plugins: [
				ssrHotReload(),
				cloudflare(),
				viteTsConfigPaths(),
				react(),
				tailwindcss(),
			],
			optimizeDeps: {
				include: [
					"react",
					"react-dom",
					"@tanstack/react-query",
					"@tanstack/react-table",
					"@dnd/kit",
					"@dnd-kit/sortable",
					"@dnd-kit/core",
					"@dnd-kit/accessibility",
					"@dnd-kit/utilities",
					"@dnd-kit/modifiers",
				],
			}
		};
	}
	if (!isSsrBuild) {
		return {
			plugins: [
				viteTsConfigPaths(),
				react(),
				cloudflare(),
				tailwindcss(),
				build({ outputDir: "dist" })
			],
			build: {
				rollupOptions: {
					input: ["./src/style.css", "./src/main.tsx"],
					output: {
						assetFileNames: "assets/[name].[ext]",
						chunkFileNames: "assets/[name].js",
						entryFileNames: "assets/[name].js",
						manualChunks: {
							main: ["./src/main.tsx"],
						},
					},
				},
			},
		};
	}
	return {
		ssr:{
			noExternal: true,
		},
		plugins: [build({ outputDir: "dist-server" }), viteTsConfigPaths()],
	};
});
