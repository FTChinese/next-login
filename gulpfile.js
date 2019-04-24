const gulp = require("gulp");
const ts = require("gulp-typescript");
const rollup = require("rollup");
let cache;

const tsProject = ts.createProject("tsconfig.json");

const tsOutDir = "build/js";
const jsInputFile = "build/js/main.js";
const jsOutFile = "dist/script/bundle.js";

/**
 * @description Compile TypeScript to ES5
 */
function compileTs() {
  return tsProject.src()
    .pipe(tsProject())
    .pipe(gulp.dest(tsOutDir));
};

/**
 * @description Bundle JS to a single file.
 */
async function linkJs() {
  const bundle = await rollup.rollup({
    input: jsInputFile,
    cache,
    plugins: [
      // babel({
      //   exclude: 'node_modules/**'
      // })
    ],
  });

  console.log(bundle.watchFiles);

  await bundle.write({
    file: jsOutFile,
    format: "iife",
    sourcemap: true,
  });
}

/**
 * @description Compile ts and bundle js.
 * The generated js is put into `dist` directory. 
 * It is not minified and is committed to version 
 * controlin case we need to copy + paste the code 
 * somewhere else without the need to waste time 
 * installing all the build toolcharins, 
 * which are often shabby and broken.
 * To get a minified version, run command
 * `npm run build-ts` which will directly compile
 * from ts files and put resulting file into 
 * `build/outputs` directory.
 * The minified file is actually embedded into HTML. 
 * You can see it in file under `view/assets`.
 * Remember never build frontend assets on server-side
 * when a request comes. Front end assets building are
 * quite CPU intensive. They should be static the
 * the moment serve app starts.
 */
const buildJs = gulp.series(compileTs, linkJs);

exports.script = buildJs;

exports.watch = gulp.parallel(buildJs, function() {
  gulp.watch(["client/script/*.ts"], buildJs);
});
