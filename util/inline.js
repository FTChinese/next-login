const { inlineSource } = require("inline-source");
const path = require("path");
const fs = require("fs").promises;

const script =`<script inline src="build/production/main.js"></script>`
const style = `<link inline rel="stylesheet" href="build/production/main.css">`

async function inlineJs() {
  const html = await inlineSource(script);

  const dest = path.resolve(__dirname, "../view/assets/script.html");

  console.log(`Wrting file to ${dest}`);

  await fs.writeFile(dest, html);
}

async function inlineCss() {
  const html = await inlineSource(style);

  const dest = path.resolve(__dirname, "../view/assets/style.html");

  console.log(`Writing file to ${dest}`);

  await fs.writeFile(dest, html);
}

if (require.main === module) {
  Promise.all([
    inlineJs(),
    inlineCss(),
  ])
  .then(() => {
    console.log("Inline finished");
  }).catch(err => {
    console.error(err);
  });
}
