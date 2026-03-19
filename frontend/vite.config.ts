import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      __KAKAO_MAP_KEY__: JSON.stringify(env.VITE_KAKAO_MAP_KEY ?? ''),
    },
  }
})
