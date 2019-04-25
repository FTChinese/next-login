const sass = require("node-sass");
const { promisify } = require("util");
const render = promisify(sass.render);
const fs = require("fs").promises;
const path = require("path");

async function buildSass() {
  try {
    const result = await render({
      file: path.resolve(__dirname, "../client/scss/main.scss"),
      outFile: "bundle.css",
      outputStyle: "expanded",
      sourceMap: true,

    });

    const dir = path.resolve(__dirname, "../dist/style");
    await Promise.all([
      fs.writeFile(`${dir}/bundle.css`, result.css),
      fs.writeFile(`${dir}/bundle.css.map`, result.map),
    ]);
  } catch(e) {
    console.error(e.message)
    console.error(`Line ${e.line}, Colum ${e.column} in ${e.file}`);
  }
}

if (require.main === module) {
  buildSass().catch(err => {
    console.error(err);
  });
}

module.exports = buildSass;
