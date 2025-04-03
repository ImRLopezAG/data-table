import MillionLint from '@million/lint';
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [MillionLint.vite({
    enabled: true,
    optimizeDOM: true,
  }), react(), tailwindcss(), viteTsConfigPaths()],
})
