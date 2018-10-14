const UrlBuilder = require('../util/build-url');
const test = require('ava');

test('url', async t => {
  const result = new UrlBuilder('http://www.ftchinese.com/callback')
    .query({
      a: 'foo',
      b: 'bar'
    })
    .hash('redirect')
    .toString();

  console.log(result);

  t.truthy(result);
});