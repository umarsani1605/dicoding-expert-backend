import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    env: dotenv.config({ path: '.test.env' }).parsed,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: [
        'src/**/_test/**',
        'src/app.js',
        'src/Commons/config.js',
      ],
    },
  },
});
