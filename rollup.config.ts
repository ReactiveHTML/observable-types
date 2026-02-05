import fs from 'fs';
import path from 'path';  
import { RollupOptions, OutputOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const terserOptions = {
  compress: {
    drop_debugger: false,
  },
};

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));

const peerDependencies = Object.keys(pkg.peerDependencies ?? []);

const es: OutputOptions = {
  dir: './dist',
  entryFileNames: '[name].mjs',
  exports: 'named',
  externalLiveBindings: false,
  format: 'es',
  freeze: false,
  // generatedCode: 'es6',
  // interop: 'default',
  sourcemap: true,
};

const preserveModules = {
  dir: './dist/modules',
  preserveModules: true,
};

export default [
  {
    external: [
      ...peerDependencies,
    ],
    input: './src/index.ts',
    treeshake: {
      propertyReadSideEffects: false,
    },
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.build.json',
        sourceMap: true,
        declarationDir: './dist/types',
      }),
      terser(terserOptions),
      // visualizer({ filename: 'bundle-stats.html' }),
    ],
    output: [
      es,
    ],
  },


  // {
  //   input: './src/index.ts',
  //   plugins: [
  //     nodeResolve({ preferBuiltins: true }),
  //     commonjs(),
  //     json(),
  //     typescript({
  //       tsconfig: './tsconfig.build.json',
  //       sourceMap: true,
  //       declarationDir: './dist/types',
  //     }),
  //     terser(),
  //   ],
  //   output: [ cjs, es ],
  //   external: [
  //     ...peerDependencies,
  //   ]
  // },
  // {
  //   input: './src/index.ts',
  //   plugins: [
  //     nodeResolve({ preferBuiltins: true }),
  //     commonjs(),
  //     json(),
  //     typescript({
  //       tsconfig: './tsconfig.build.json',
  //       sourceMap: true,
  //       outDir: preserveModules.dir,
  //       declaration: false,
  //     }),
  //     terser(),
  //   ],
  //   output: [
  //     {
  //       ...cjs,
  //       ...preserveModules,
  //     },
  //     {
  //       ...es,
  //       ...preserveModules,
  //     }
  //   ],
  //   external: [
  //     ...peerDependencies,
  //   ]
  // },
] as RollupOptions[];
