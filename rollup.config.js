import typescript from 'rollup-plugin-typescript';
import minify from "rollup-plugin-babel-minify";

export default [
  {
    input: "./client/script/main.ts",
    plugins: [
      typescript(),
    ],
    output: {
      file: "build/dist/main.js",
      format: "iife",
      sourcemap: true,
    }
  },
  {
    input: "./client/script/main.ts",
    plugins: [
      typescript(),
      minify(),
    ],
    output: {
      file: "build/production/main.js",
      format: "iife",
      sourcemap: true,
    }
  }
];
