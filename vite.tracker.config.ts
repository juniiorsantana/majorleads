
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/tracker/core.ts'),
            name: 'LeadSense',
            fileName: (format) => `tracker.${format}.js`,
            formats: ['iife'], // Build as IIFE for direct browser inclusion
        },
        outDir: 'dist/tracker',
        emptyOutDir: true,
    },
});
