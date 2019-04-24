import typescript from 'rollup-plugin-typescript';
import minify from "rollup-plugin-babel-minify";

export default {
  input: "./client/script/main.ts",
  plugins: [
    typescript(),
    minify(),
  ],
  output: {
    file: "build/outputs/bundle.min.js",
    format: "iife",
    sourcemap: true,
  }
};
