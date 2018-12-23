const crypto = require('crypto');
const util = require('util');
const base64url = require('./base64url');

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

/**
 * @param {number} size=9 - number of bytes
 * @return {string}  72 bits turns to 12 characters
 */
exports.state = async function (size=9) {
  const buf = await randomBytes(size);
  return base64url.encode(buf);
}
