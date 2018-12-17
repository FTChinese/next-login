const test = require('ava');
const Joi = require('joi');
const schema = require('../server/schema');
const {processJoiError} = require('../util/errors');
const {validateLogin} = require("../util/validate")
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

/**
 * isJoi: true,
  name: 'ValidationError',
  details: [ 
    { message: '"email" must be a valid email',
       path: [ 'email'],
       type: 'string.email',
       context: { value: 'foo', key: 'email', label: 'email' } 
    },
    { 
      message: '"password" length must be at least 8 characters long',
      path: [ 'password' ],
      type: 'string.min',
      context: { 
        limit: 8,
        value: '1234567',
        encoding: undefined,
        key: 'password',
        label: 'password' 
      } 
    },
  _object: { 
    email: 'foo', 
    password: '1234567' 
  },
  annotate: { 
    [Function]
     [length]: 1,
     [name]: '',
     [prototype]: { [constructor]: [Circular] } 
    } 
  }
 */
test('credentials', async t => {
  try {
    const result = await Joi.validate(credentials, schema.account, {
      abortEarly: false
    });

    console.log(result)
  } catch (e) {
    console.log("Error: %o", e);
  }

  t.pass();
});

test("login", async t => {
  const {result, errors} = await validateLogin(credentials);

  console.log(result);
  console.log(errors);

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

test('joi', async t => {
  const data = {
    customer: {
      income: 100
    }
  }

  const schema = {
    customer: {
      income: Joi.number().min(500)
    }
  };

  const result = Joi.validate(data, schema);

  if (result.error) {
    console.log("Validation error: %o", result.error);
  }

  console.log(result.value);

  t.pass()
});

