const test = require('ava');
const send = require('../utils/send-email');
const random = require('../utils/random');
const NodeCache = require('node-cache');
const myCache = new NodeCache();

test('email', async t => {
  const code = await random();

  const info = await send({
    name: 'Foo Bar',
    address: 'neefrankie@gmail.com',
    code
  });

  console.log(info);

  t.truthy(info);
});

test('cache', async t => {

})
