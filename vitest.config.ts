import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['tracker/src/core/__tests__/**/*.test.{ts,js}'],
    },
});
