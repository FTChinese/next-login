const test = require('ava');
const Chance = require("chance");
const validator = require('validator');

const chance = new Chance();

test("isLength", async t => {
  const str = chance.string({ length: 5 });

  const isNotLen = !validator.isLength(str, {max: 50});

  console.log(isNotLen);

  t.pass();
});


