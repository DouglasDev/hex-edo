import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wyw from '@wyw-in-js/vite';

function revision() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);

  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'development';
  }
}

const commit = revision();

export default defineConfig({
  base: './',
  cacheDir: '.vite-cache',
  define: { __APP_COMMIT__: JSON.stringify(commit) },
  plugins: [
    { ...wyw({ include: ['src/**/*.tsx'] }), enforce: 'pre' },
    react(),
    {
      name: 'version',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ commit }),
        });
      },
    },
  ],
});
