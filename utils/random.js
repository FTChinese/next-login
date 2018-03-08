const crypto = require('crypto');
const util = require('util');

const randomBytes = exports.randomBytes = util.promisify(crypto.randomBytes);

module.exports = async function(bits=512, encoding='hex') {
  const buf = await randomBytes(Math.trunc(bits/8));
  return buf.toString(encoding);
}
