const test = require('ava');
const Joi = require('joi');
const schema = require('../server/schema');
const {handleJoiErr} = require('../utils/errors');

const credentials = {
  email: 'foo',
  // password: '1234567'
};

test('credentials', async t => {
  try {
    const result = await Joi.validate(credentials, schema.credentials, {
      abortEarly: false
    });

    console.log(result)
  } catch (e) {
    console.log("Error: %o", e);
  }

  t.pass();
});

test('handleJoiErr', async t => {
  try {
    const result = await Joi.validate(credentials, schema.credentials, {
      abortEarly: false
    });

    console.log(result)
  } catch (e) {
    console.log("Formatted error: %o", handleJoiErr(e));
  }

  t.pass();
});