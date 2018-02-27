const test = require('ava');
const request = require('superagent');

const accessToken = process.env.N_TEST_TOKEN;
const uuid = process.env.N_TEST_UUID;

test('authenticateUser', async t => {
  try {
    const resp = await request.get('http://localhost:8000/user/profile')
    .auth(`${accessToken}.${uuid}`, {type: 'bearer'});

    console.log('User info: %o', resp.body);

    t.is(resp.status, 200)
  } catch (err) {
    console.log("Status: %d", err.status);
    console.log("Status message: %s", err.message);
    console.log("Response headers: %o", err.response.header);
    console.log("Body: %o", err.response.body);
  }
});