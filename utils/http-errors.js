exports.ErrorForbidden = class extends Error {
  constructor(message='Forbidden') {
    super(message);
    this.status = 403;
  }
}

exports.ErrorNotFound = class extends Error {
  constructor(message='Not Found') {
    super(message);
    this.status = 404;
  }
}

const messages = {
  email: '邮箱',
  already_exists: '已经存在'
}

/**
 * gatherAPIErrors - Turn API error code into human readable text
 *
 * @param {Object} msg
 * @param {string} msg.message
 * @param {Object[]} msg.errors
 * @param {string} msg.errors[].resource
 * @param {string} msg.errors[].field
 * @param {string} msg.errors[].code
 * @return {Object}   description
 */
exports.gatherAPIErrors = function gatherAPIErrors(msg) {
  if (!msg.errors || !Array.isArray(msg.errors) || msg.errors.length === 0) {
    return null;
  }

  const o = {};
  console.log(msg.errors);

  for (const err of msg.errors) {
    o[err.field] = `${messages[err.field]}${messages[err.code]}`;
  }
  return o;
}
