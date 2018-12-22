const validator = require("validator");
const { trimObject, message, isString } = require("./util");

/**
 * @param {string} password 
 */
function validatePassword(password) {
  if (!isString(password)) {
    return {
      password: null,
      error: message.passwordInvalid,
    };
  }

  password = password.trim();

  if (validator.isEmpty(password)) {
    return {
      password: null,
      error: message.passwordRequired
    };
  }

  if (!validator.isLength(password, {max: 128})) {
    return {
      password: null,
      error: message.passwordMax,
    };
  }

  return {
    password,
    error: null,
  };
}

class PasswordResetValidator {
  /**
   * @param {Object} pw
   * @param {string} pw.password
   * @param {string} pw.confirmPassword
   */
  constructor(pw) {
    /**
     * @type {{password: string, confirmPassword: string}}
     */
    this.errors = {};
    /**
     * @type {{password: string, confirmPassword: string}}
     */
    this.result = {};
    this.isError = false;

    /**
     * @type {{password: string, confirmPassword: string}}
     */
    this.data = trimObject(pw)
  }

  validate() {
    Object.entries(this.data).forEach(([key, value]) => {
      const {password, error} = validatePassword(value);
      if (error) {
        this.errors[key] = error;
        this.isError = true;
      } else {
        this.result[key] = password;
      }
    });

    if (this.isError) {
      return {
        result: null,
        errors: this.errors,
      };
    }

    return {
      result: this.result,
      errors: null,
    }
  }
}

exports.PasswordResetValidator = PasswordResetValidator;
exports.validatePassword = validatePassword;