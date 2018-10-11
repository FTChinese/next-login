module.exports = {
  unescape,
  escape,
  encode,
  decode
}

/**
 * @description Turn base64url encoded string to base64 encoded string.
 * @param {string} str
 * @return {string}
 */
function unescape (str) {
  return (str + '==='.slice((str.length + 3) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
}

/**
 * @description Turn base64 encoded string to base64url encoded string
 * @param {string} str
 * @return {string}
 */
function escape (str) {
  return str.replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * @description base64url encode a buffer
 * @param {Buffer} buf
 * @return {string}
 */
function encode (buf) {
  return escape(buf.toString('base64'))
}

/**
 * @description Turn base64url encoded string back or original buffer
 * @param {string} str - base64url encoded string
 * @return {Buffer}
 */
function decode (str) {
  return Buffer.from(unescape(str), 'base64')
}
