const crypto = require('crypto');
const util = require('util');

const randomBytes = util.promisify(crypto.randomBytes);

async function random(size, encoding) {
  const buf = await randomBytes(size);
  if (!encoding) {
    return buf;
  }
  return buf.toString(encoding);
}

exports.hex = function(size=32) {
  return random(size, 'hex');
}
