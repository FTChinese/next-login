const debug = require('./debug')('user:errors');
const message = require('./message');

const fields = Object.freeze({
  email: 'email',
  emailToken: 'email_token',
  server: 'server',
  passwordToken: 'password_token',
  passwordReset: 'password_reset',
  oldPassword: 'oldPassword',
  confirmPassword: 'confirmPassword',
});

const types = Object.freeze({
  notFound: 'not_found',
  forbidden: 'forbidden',
  unauthorized: 'unauthorized',
  mismatched: 'mismatched',
});

const alertActions = Object.freeze({
  emailVerfied: 'email_verified',
  emailSaved: 'email_saved',
  newsletterSaved: 'newsletter_saved',
  letterSent: 'letter_sent',
  passwordChanged: 'password_changed'
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
 * @param {SuperAgentError} err 
 * @param {string} field
 * @returns {InvalidFields}
 */
exports.processApiError = function(err, field='') {
  if (!exports.isSuperAgentError(err)) {
    throw err;
  }

  const body = err.response.body;

  debug.error('API error response: %O', body);

  switch (err.status) {
    // Unauthorized
    case 401: 
      return buildInvalidField(fields.server, types.unauthorized, body.message);

    // Forbidden
    case 403: 
      return buildInvalidField(field, types.forbidden, body.message);

    // Not Found
    case 404: 
      return buildInvalidField(field, types.notFound, body.message)

    // Unprocessable Entity.
    case 422: 
      const error = body.error;
      return buildInvalidField(error.field, error.code, error.message)

    default:
      return buildInvalidField(fields.server)
  }
};

/**
 * @param {InvalidError} invalid 
 * @param {string} defaultMsg 
 */
function buildInvalidField(field, type='error', defaultMsg='') {
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

exports.buildInvalidField = buildInvalidField;

exports.buildAlertDone = function (field) {
  return {done: field};
}

