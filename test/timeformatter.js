const test = require('ava');
const formatter = require('../util/format-time');

test('cst', async t => {
  console.log(formatter.iso8601ToDate("2018-09-26T07:49:34Z"));

  t.pass();
});