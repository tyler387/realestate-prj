import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, '..')
  const env = loadEnv(mode, rootDir, '')

  return {
    plugins: [react()],
    envDir: rootDir,
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
    },
    define: {
      __KAKAO_MAP_KEY__: JSON.stringify(env.VITE_KAKAO_MAP_KEY ?? ''),
    },
  }
})
