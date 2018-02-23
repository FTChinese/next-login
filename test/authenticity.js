const test = require('ava');
const randomString = require('../utils/random-string');

test('authenticityCode', async t => {
  const code = await randomString();
  console.log(code);
  console.log(code.length);
  t.pass("Generated authenticity code");
});