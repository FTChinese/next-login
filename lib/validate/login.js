const validator = require("validator");
const { trimObject, message } = require("./util");

class LoginValidator {
  /**
   * @param {Object} login
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @param {boolean} isCompatible - A switch indicating whether the validation should be backward compatible. True when used for login, false when user is changing password
   */
  constructor(login) {
    this.errors = {};
    this.result = {};
    this.isError = false;

    /**
     * @type {{email: string, password: string}}
     */
    this.login = trimObject(login);
  }

  /**
   *  Joi.string().trim().email().min(3).max(254).required()
   */
  verifyEmail() {
    if (validator.isEmpty(this.login.email)) {
      this.errors.email = message.emailRequired;
      this.isError = true;
      return;
    }

    if (!validator.isEmail(this.login.email)) {
      this.errors.email = message.emailInvalid;
      this.isError = true;
      return;
    }

    this.result.email = this.login.email;
  }

  /**
   * Joi.string().trim().min(8).max(128).required()
   */
  verifyPassword() {
    if (validator.isEmpty(this.login.password)) {
      this.errors.password = message.passwordRequired;
      this.isError = true;
      return;
    }

    if (!validator.isLength(this.login.password, {max: 128})) {
      this.errors.password = message.passwordMax;
      this.isError = true;
      return;
    }

    this.result.password = this.login.password;
  }

  validate() {
    this.verifyEmail();
    this.verifyPassword();

    if (this.isError) {
      return {
        result: null,
        errors: this.errors
      };
    }

    return {
      result: this.result,
      errors: null
    };
  }
}

exports.LoginValidator = LoginValidator;