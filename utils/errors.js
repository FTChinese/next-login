const debug = require('./debug')('user:errors');
const codes = Object.freeze({
  notFound: 'not_found',
  missing: 'missing',
  missingField: 'missing_field',
  invalid: 'invalid',
  exists: 'alrady_exists'
});

const keys = Object.freeze({
  email: 'email',
  credentials: 'credentials',
  password: 'password',
});

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
 * @param {SuperAgentError} body 
 * @param {string} key 
 * @return {Object}
 */
function apiNotFound (body, key) {

  const ret = {};
  let message = '';

  switch (key) {
    case keys.credentials:
      message = '邮箱或密码错误';
      break;

    default:
      message = body.message;
      break;
  }

  ret[key] = {
    code: codes.notFound,
    message,
  }

  debug.info('Not found: %O', ret);

  return ret;
}

/**
 * 
 * @param {APIErrorBody} body 
 * @param {string} key 
 * @return {Object}
 */
function apiForbidden (body, key) {
  const ret = {};
  let message = '';

  switch (key) {
    case 'oldPassword':
      message = '当前密码不对';
      break;

    default:
      message = body.message
      break;
  }

  ret[key] = {
    code: 'fobidden',
    message,
  };

  return ret;
}
/**
 * @param {APIErrorBody} body
 * @return {Object}
 */
function apiUnprocessable (body) {

  const error = body.error;
  const ret = {};
  const key = error.field;
  let message;

  switch (key) {
    case keys.email:
      message = '邮箱地址';
      break;

    default:
      break;
  }

  switch (error.code) {
    case codes.missing:
      message = '请求的资源不存在';
      break;

    case codes.missingField:
      message += '不能为空';
      break;

    case codes.invalid:
      message += '无效';
      break;

    case codes.exists:
      message += '已经存在';
      break;

    default:
      message = error.message || 'API错误';
      break;
  }

  ret[key] = {
    code: error.code,
    message
  };

  return ret;
}

/**
 * @param {JoiErr} joiErr 
 * @returns {Object} - The value of each key is UIError
 */
exports.processJoiError = function(joiErr) {
  if (!joiErr.isJoi) {
    throw joiErr;
  }

  const ret = {};
  debug.info('Joi errror details: %O', joiErr.details);

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
      code: codes.invalid,
      message
    }
  }

  debug.info('Validation err from Joi: %O', ret);
  return ret;
};

/**
 * @param {SuperAgentError} err 
 * @param {string} key
 * @returns {Object}
 */
exports.processApiError = function(err, key='') {
  if (!exports.isSuperAgentError(err)) {
    throw err;
  }

  const body = err.response.body;

  debug.error('API error response: %O', body);

  switch (err.status) {
    case 403:
      return apiForbidden(body, key);

    case 404:
      return apiNotFound(body, key)

    case 422:
      return apiUnprocessable(body)

    default:
      return {
        serverError: {
          message: '服务器错误，请稍后再试'
        }
      };
  }
};

/**
 * @param {SuperAgentError} e
 * @return {boolean}
 */
exports.isSuperAgentError = function (e) {
  if (e.response && e.response.body && e.status) {
    return true;
  }
  return false;
};

