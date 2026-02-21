
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, 'tracker/src/core/init.ts'),
            name: 'LeadSense',
            fileName: () => `tracker.js`,
            formats: ['iife'],
        },
        outDir: 'public',
        emptyOutDir: false,
    },
});
