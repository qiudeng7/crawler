import { defineConfig } from 'tsup';
import { copyFileSync, existsSync } from 'fs';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli.ts',
    'src/rabbitmq/index.ts',
    'src/douyin/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
  target: 'es2020',
  shims: true,
  onSuccess: async () => {
    // 复制 sign.js 到 dist 目录
    const srcPath = 'src/douyin/sign/sign.js';
    const destPath = 'dist/sign.js';

    if (existsSync(srcPath)) {
      copyFileSync(srcPath, destPath);
      console.log(`✓ Copied ${srcPath} to ${destPath}`);
    }
  },
});
