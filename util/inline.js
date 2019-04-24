const { inlineSource } = require("inline-source");
const path = require("path");
const fs = require("fs").promises;

const script =`<script inline src="build/outputs/bundle.min.js"></script>`
const style = `<link rel="stylesheet" href="build/outputs/bundle.min.css">`

async function inline() {
  const scriptHtml = await inlineSource(script);

  await fs.writeFile(path.resolve(__dirname, "../view/assets/js.min.html"), scriptHtml);
}

if (require.main === module) {
  inline().catch(err => {
    console.error(err);
  });
}

module.exports = inline;
