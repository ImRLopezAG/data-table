import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/_components'),
      '@hooks': resolve(__dirname, './src/_hooks'),
      '@services': resolve(__dirname, './src/_services'),
      '@ui': resolve(__dirname, './src/_components/ui'),
      '@shared': resolve(__dirname, './src/shared')
    }
  }
})
