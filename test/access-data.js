const test = require('ava');
const fetchAccess = require('../util/fetch-access');

test('fetchAccessToken', async t => {
  const accessData = await fetchAccess();

  console.log("Access Data: %o", accessData);

  t.not(accessData, null);
});