import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          500: '#0e7490',
          600: '#005a71',
          700: '#155e75',
          900: '#001f29',
        },
        surface: {
          app: '#f8fafc',
          base: '#ffffff',
          soft: '#f1f5f9',
          raised: '#ffffff',
          tint: '#f0f9ff',
        },
        text: {
          strong: '#0f172a',
          body: '#334155',
          muted: '#64748b',
          subtle: '#94a3b8',
        },
        line: {
          base: '#e2e8f0',
          strong: '#cbd5e1',
        },
        market: {
          sale: '#ef4444',
          jeonse: '#2563eb',
          rent: '#059669',
          warning: '#f59e0b',
        },
      },
      boxShadow: {
        panel: '0 4px 12px rgba(15, 23, 42, 0.05)',
        floating: '0 12px 28px rgba(15, 23, 42, 0.16)',
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Noto Sans KR',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
