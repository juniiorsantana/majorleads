import typescript from '@rollup/plugin-typescript';

export default [
    // Bundle principal (IIFE — injeta window.LeadSense)
    {
        input: 'src/core/init.ts',
        output: {
            file: '../dist/tracker.js',
            format: 'iife',
            name: 'LeadSenseLoader',
            sourcemap: false,
        },
        plugins: [typescript({ tsconfig: './tsconfig.json' })],
    },
    // Bundle minificado para produção
    {
        input: 'src/core/init.ts',
        output: {
            file: '../dist/tracker.min.js',
            format: 'iife',
            name: 'LeadSenseLoader',
            sourcemap: false,
        },
        plugins: [typescript({ tsconfig: './tsconfig.json' })],
    },
];
