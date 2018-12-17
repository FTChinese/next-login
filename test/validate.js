const test = require('ava');
const Chance = require("chance");
const {validateLogin} = require("../util/validate");

const chance = new Chance();

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

test("login", async t => {
  const login = {
    email: chance.email(),
    password: chance.character()
  }
  const {result, errors} = await validateLogin();

  console.log(result);
  console.log(errors);

  t.pass();
});
