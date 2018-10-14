const test = require('ava');
const fetchAccess = require('../util/fetch-access');
const request = require('superagent');

test('authenticateUser', async t => {
  const accessData = await fetchAccess();
  console.log('Access data: %o', accessData);

  try {
    const resp = await request.post('http://localhost:8000/authenticate')
    .auth(accessData.access_token, {type: 'bearer'})
    .send({
      email: 'matthewharris773@example.com',
      password: '12345678'
    });

    console.log('IDToken: %o', resp.body);

    t.is(resp.status, 200)
  } catch (err) {
    console.log("Status: %d", err.status)
    console.log("Body: %o", err.response.body);
  }
});
