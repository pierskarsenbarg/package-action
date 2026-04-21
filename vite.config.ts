import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    target: 'node22',
    rollupOptions: {
      external: builtinModules.flatMap(m => [m, `node:${m}`]),
    },
    minify: false,
    sourcemap: true,
  },
});
