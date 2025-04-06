import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		viteTsConfigPaths(),
	],
});
