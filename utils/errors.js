exports.ErrorForbidden = class extends Error {
  constructor(message='Forbidden') {
    super(message);
    this.status = 403;
  }
};

exports.ErrorNotFound = class extends Error {
  constructor(message='Not Found') {
    super(message);
    this.status = 404;
  }
};

/**
 * 
 * @param {Error} joiErr 
 * @param {boolean} joiErr.isJoi
 * @param {string} joiErr.name - ValidationError
 * @param {Object[]} joiErr.details
 * @param {string} joiErr.details[].message
 * @param {string[]} joiErr.details[].path
 * @param {string} joiErr.details[].type
 * @param {Object} joiErr.details[].context
 * @param {number} joiErr.details[].context.limit
 * @param {string} joiErr.details[].context.value
 * @param {string} joiErr.details[].context.encoding
 * @param {string} joiErr.details[].context.key
 * @param {string} joiErr.details[].context.label
 */
exports.handleJoiErr = function(joiErr) {
  if (!joiErr.isJoi) {
    throw joiErr;
  }

  const ret = {};

  for (const detail of joiErr.details) {
    const key = detail.context.key;
    const value = detail.context.value;

    let message;

    switch (detail.type) {
      case 'any.required':
        message = '必填项';
        break;

      case 'string.email':
        message = '邮箱地址无效';
        break;

      case 'string.min':
        message = '过短';
        break;

      case 'string.max':
        message = '过长';
        break;

      default:
        message = detail.message
        break;
    }

    ret[key] = {
      value,
      message
    }
  }

  return ret;
};

/**
 * @param {Object} err
 * @param {Object} err.response
 * @param {number} err.status
 */
exports.handleApiUnprocessable = function(err) {
  if (!err.response) {
    throw err;
  }
  
  if (422 !== err.status) {
    throw err;
  }

  /**
   * @type {{message: string, error: Object}}
   */
  const body = err.response.body;
  /**
   * @type {{field: string, code: string, message: string}}
   * code: missing | missing_field | invalid | already_exists
   */
  const error = body.error;
  const ret = {};
  const key = error.field;
  let message;

  switch (key) {
    case 'email':
      message = '邮箱地址';
      break;

    default:
      message = key;
      break;
  }

  switch (error.code) {
    case 'missing_field':
      message += '不能为空';
      break;

    case 'invalid':
      message += '无效';
      break;

    case 'already_exists':
      message += '已经存在';
      break;

    default:
      message += err.message || 'API Error';
      break;
  }

  ret[key] = {
    message
  };

  return ret;
}

/**
 * 
 * @param {Object} e 
 * @return {boolean}
 */
exports.isSuperAgentErr = function (e) {
  if (e.response && e.response.body && e.status) {
    return true;
  }
  return false;
}