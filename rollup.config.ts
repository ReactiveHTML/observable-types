import fs from 'fs';
import path from 'path';  
import { RollupOptions, OutputOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';


const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));

const peerDependencies = Object.keys(pkg.peerDependencies || {});

const cjs: OutputOptions = {
  dir: './dist',
  entryFileNames: '[name].cjs',
  exports: 'named',
  externalLiveBindings: false,
  format: 'cjs',
  freeze: false,
  // generatedCode: 'es6',
  // interop: 'default',
  sourcemap: true,
}

const es: OutputOptions = {
  ...cjs,
  entryFileNames: '[name].mjs',
  format: 'es',
};

const globalVar: OutputOptions = {
  ...cjs,
  dir: './dist-global',
  entryFileNames: '[name].js',
  freeze: true,
  generatedCode: 'es2015',
  sourcemap: true,
  format: 'esm',
  globals: {
    'rml': 'rimmel',
  }
};

const preserveModules = {
  dir: './dist/modules',
  preserveModules: true,
};

export default [
  {
    external: [
      ...peerDependencies,
      'rimmel',
      'rxjs',
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
      terser(),
      // visualizer({ filename: 'bundle-stats.html' }),
    ],
    output: [
      cjs,
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
  //     'rimmel',
  //     'rxjs',
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
  //     'rimmel',
  //     'rxjs',
  //   ]
  // },
] as RollupOptions[];
