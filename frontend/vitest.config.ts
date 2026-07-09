import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      thresholds: { lines: 50, functions: 50, branches: 40 },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/types/**',
        'src/pages/**',
        'src/App.tsx',
        'src/hooks/**',
        'src/components/AppSidebar.tsx',
        'src/components/CodePanel.tsx',
        'src/components/PreviewPanel.tsx',
        'src/components/VersionHistory.tsx',
      ],
    },
  },
})
