import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: [
        'controllers/**',
        'models/**',
        'routes/**',
        'services/**',
        'middleware/**',
      ],
    },
    // Sequential to avoid MongoDB port conflicts
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
