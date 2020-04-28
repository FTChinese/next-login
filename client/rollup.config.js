import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import autoPreprocess from 'svelte-preprocess'
import typescript from '@rollup/plugin-typescript';
import { terser } from "rollup-plugin-terser";
import buble from '@rollup/plugin-buble';

const production = !process.env.ROLLUP_WATCH;

export default [
  // Process vanilla TS.
  {
    input: "./client/script/main.ts",
    output: {
      file: "./build/script/main.js",
      format: "iife",
      sourcemap: true,
    },
    plugins: [
      // When using this plugin, tsconfig.json cannot have this option:  
      // "outDir": "../build/ts-out"
      // See https://github.com/rollup/plugins/issues/287
      typescript({
        tsconfig: './client/tsconfig.json' // relative to process.cwd().
      }),
      buble(),
      production && terser(),
    ],
  },
  // Process svelte.
  {
    input: './client/src/main.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: './build/script/reader-app.js'
    },
    plugins: [
      svelte({
        // enable run-time checks when not in production
        dev: !production,
        preprocess: autoPreprocess(),
        // we'll extract any component CSS out into
        // a separate file - better for performance
        css: css => {
          css.write('./build/style/reader-app.css');
        }
      }),

      // If you have external dependencies installed from
      // npm, you'll most likely need these plugins. In
      // some cases you'll need additional configuration -
      // consult the documentation for details:
      // https://github.com/rollup/plugins/tree/master/packages/commonjs
      resolve({
        browser: true,
        dedupe: ['svelte']
      }),
      commonjs(),
    
      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser()
    ],
    watch: {
      clearScreen: false
    }
  }
];
