const test = require('ava');
const request = require('superagent');

const accessToken = process.env.N_TEST_TOKEN;

test('email', async t => {
  try {
    const resp = await request.get(`http://localhost:8000/is-taken?email=matthewharris773@example.com`)
      .auth(accessToken, {type: 'bearer'})

    console.log(resp.status)

  } catch (e) {
    console.log(e.status)
  }

  t.pass('test if email exists');
});

test('name', async t => {
  try {
    const resp = await request.get(`http://localhost:8000/is-taken?name=matthewharris`)
      .auth(accessToken, {type: 'bearer'})

    console.log(resp.status)

  } catch (e) {
    console.log(e.status)
  }

  t.pass('test if username exists');
});
