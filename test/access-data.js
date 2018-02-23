const loadJsonFile = require('load-json-file');
const {resolve} = require('path');

async function test() {
  const accessData = await loadJsonFile(resolve(__dirname, `../.tmp/access.json`));

  console.log(accessData);
}

test().catch(err => {
  console.log(err);
});