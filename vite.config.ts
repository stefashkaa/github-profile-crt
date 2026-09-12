import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node20',
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        cli: resolve(import.meta.dirname, 'src/cli.ts')
      },
      external: [/^node:/, 'dotenv/config', 'svgo'],
      output: {
        format: 'es',
        entryFileNames: '[name].js'
      }
    }
  }
});
