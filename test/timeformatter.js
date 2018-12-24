const test = require('ava');
const { parseDateTime } = require("../lib/date-time");

test("parse", async t => {
  const mmt = parseDateTime("2018-12-24");

  console.log(mmt);
  
  t.pass();
});