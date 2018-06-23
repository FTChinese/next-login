const debug = require('./debug')('user:errors');
const message = require('./message');

const fields = Object.freeze({
  email: 'email',
  token: 'token',
  letter: 'letter'
});

/**
 * @param {JoiErrDetail[]} details
 * @returns {InvalidError[]}
 */
exports.transformJoiDetails = function(details) {

  return details.map(detail => {
    const field = detail.path.join('_');
    const type = detail.type;
    // msg is an id used to search for localized message text.
    // Possible examples:
    // email.any.required
    // email.string.email
    // name.string.min
    // name.string.max
    const msg = `${field}.${type}`

    return {
      field,
      type,
      msg,
      message: detail.message
    };
  });
};

/**
 * @param {JoiErr} joiErr
 * @returns {InvalidFields}
 */
exports.processJoiError = function(joiErr) {
  if (!joiErr.isJoi) {
    throw joiErr;
  }

  debug.info('Joi error details: %O', joiErr.details);

  const errors = exports.transformJoiDetails(joiErr.details)

  debug.info('Redable Joi errors: %O', errors);

  const readableErrors = {};

  for (const err of errors) {

    if (readableErrors.hasOwnProperty(err.field)) {
      continue;
    }

    readableErrors[err.field] = {
      type: err.type,
      message: message[err.msg] || err.message
    };
  }

  return readableErrors;
}

/**
 * 
 * @param {APIErrorBody} body 
 * @param {string} field
 * @return {InvalidFields}
 */
exports.apiNotFound = function (body, field) {

  const ret = {};
  const type = 'not_found'
  const msgId = `${field}.${type}`

  debug.info('API InvalidError: %O', {
    field,
    type,
    msg: msgId
  });

  ret[field] = {
    type,
    message: message[msgId] || body.message
  }

  debug.info('API not found error: %O', ret);

  return ret;
}

/**
 * @param {APIErrorBody} body 
 * @param {string} key 
 * @return {InvalidFields}
 */
exports.apiForbidden = function (body, field) {
  const ret = {};
  const type = 'forbidden';
  const msgId = `${field}.${type}`

  debug.info('API InvalidError: %O', {
    field,
    type,
    msg: msgId
  });

  ret[key] = {
    type,
    message: message[msgId] || body.message,
  };

  return ret;
}
/**
 * @param {APIErrorBody} body
 * @return {InvalidFields}
 */
exports.apiUnprocessable = function (body) {

  const error = body.error;
  const ret = {};
  const field = error.field;
  const msgId = `${field}.${error.code}` 

  debug.info('API InvalidError: %O', {
    field,
    type: error.code,
    msg: msgId
  });

  ret[field] = {
    type: error.code,
    message: message[msgId] || error.message
  };

  return ret;
}

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
      return exports.apiForbidden(body, key);

    case 404:
      return exports.apiNotFound(body, key)

    case 422:
      return exports.apiUnprocessable(body)

    default:
      return {
        server: {
          message: message.server_error
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

/**
 * 
 * @param {InvalidError} invalid 
 * @param {string} defaultMsg 
 */
exports.buildInvalidField = function(field, type, defaultMsg='') {
  const invalid = {
    field,
    type,
    msg: `${field}.${type}`
  };

  debug.info('Invalid information: %O', invalid);

  const o = {}
  o[invalid.field] = {
    type: invalid.type,
    message: message[invalid.msg] || defaultMsg
  };
  return;
};

exports.buildAlertDone = function (field) {
  return {done: field};
}

exports.buildAlertSaved = function(field) {
  return {saved: field};
}

