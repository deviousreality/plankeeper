import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
    // coverage: {
    //   provider: 'v8',
    //   reporter: ['text', 'json', 'html'],
    //   exclude: ['node_modules/', '.nuxt/', 'dist/', 'coverage/', '**/*.config.*', '**/mockData/**', '**/*.d.ts'],
    // },
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
});
