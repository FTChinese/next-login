const validator = require("validator");
const { isString, message } = require('./util');

module.exports = function (email) {

  if (!isString(email)) {
    return {
      result: null,
      errors: {
        email: message.emailInvalid
      }
    };
  }

  email = email.trim();

  if (validator.isEmpty(email)) {
    return {
      result: null,
      errors: {
        email: message.emailRequired,
      }
    };
  }

  if (!validator.isEmail(email)) {
    return {
      result: null,
      errors: {
        email: message.emailInvalid,
      }
    };
  }

  return {
    result: {
      email,
      errors: null
    }
  };
}