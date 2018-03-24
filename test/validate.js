const test = require('ava');
const Joi = require('joi');
const schema = require('../server/schema');

test('newsletter', async t => {
  try {
    const result = await Joi.validate({todayFocus: "true"}, schema.letter);

    console.log(result)
  } catch (e) {
    console.log("Error: %o", e);
  }

  t.pass("newsletter");
});