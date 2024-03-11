import { defineConfig } from 'tsup';

export default defineConfig((options) => [
  {
    splitting: false,
    dts: { resolve: true },
    treeshake: true,
    sourcemap: false,
    clean: true,
    entry: ['src/index.ts'],
    format: ['esm'],
    platform: 'node',
    // outExtension: (ctx) => ({ js: '.mjs' }),
    // minify: !options.watch,
  },
]);
