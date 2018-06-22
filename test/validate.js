const test = require('ava');
const Joi = require('joi');
const schema = require('../server/schema');
const {processJoiError} = require('../utils/errors');

const credentials = {
  email: 'foo',
  password: '1234567'
};

const profile = {
  familyName: '',
  givenName: '',
  birthdate: '',
  gender: 'female'
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
    console.log("Formatted error: %o", processJoiError(e));
  }

  t.pass();
});

test('profile', async t => {
  const result = schema.profile.validate(profile, {abortEarly: false})

  if (result.error) {
    console.log(result.error);
  }

  console.log(result.value);

  t.pass();
});

