import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['examples/*.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
  target: 'es2020',
});
