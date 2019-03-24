const validator = require("validator");
const { trimObject, message } = require("./util");

/**
 * @param {string} email 
 * @param {number} maxLen 
 */
function validateEmail(email, maxLen=-1) {
  if (validator.isEmpty(email)) {
    return message.emailRequired;
  }

  if (!validator.isEmail(email)) {
    return message.emailInvalid;
  }

  if (maxLen > 0) {
    if (!validator.isLength(email, {max: maxLen})) {
      return message.emailMax;
    }
  }

  return null;
}

/**
 * @param {string} pw 
 * @param {number} minLen 
 */
function validatePassword(pw, minLen=0) {
  if (validator.isEmpty(pw)) {
    return message.passwordRequired;
  }

  if (minLen > 0) {
    if (!validator.isLength(pw, {min: minLen})) {
      return message.passwordMin;
    }
  }

  if (!validator.isLength(pw, {max: 128})) {
    return message.passwordMax;
  }

  return null;
}

/**
 * Used to validate:
 * login (email + password);
 * signup (email + password);
 * email to receive password reset token (email)
 * reset password (password + confirmPassword)
 * change email (currentEmail + email)
 * change password (oldPassword + password + confirmPassword)
 * change user name (userName)
 */
class AccountValidator {
  /**
   * @typedef {Object} Account
   * @property {string} [email]
   * @property {string} [currentEmail]
   * @property {string} [password]
   * @property {string} [oldPassword]
   * @property {string} [confirmPassword]
   * @property {string} [userName]
   * 
   * @param {Account} profile
   */
  constructor(account) {
    /**
     * @type {Account}
     */
    this.errors = {};

    /**
     * @type {Account}
     */
    this.result = {};
    this.isError = false;

    /**
     * @type {Account}
     */
    this.data = trimObject(account)
  }

  validateEmail(isLogin=false) {
    const maxLen = isLogin ? 0 : 50;
    const error = validateEmail(this.data.email, maxLen);

    if (error) {
      this.errors.email = error;
      this.isError = true;
      return this;
    }
    
    this.result.email = this.data.email;

    return this;
  }

  validateEmailUpdate() {
    if (this.data.email == this.data.currentEmail) {
      this.errors.email = message.emailDuplicate;
      this.isError = true;
    }

    return this;
  }

  validatePassword(isLogin=false) {
    const minLen = isLogin ? 0 : 8;

    const error = validatePassword(this.data.password, minLen);

    if (error) {
      this.errors.password = error;
      this.isError = true;
      return this;
    }

    this.result.password = this.data.password;

    return this;
  }

  confirmPassword() {
    if (this.data.confirmPassword != this.data.password) {
      this.errors.confirmPassword = message.passwordsNotEqual;
      this.isError = true;
    }

    return this;
  }

  validateOldPassword() {
    const error = validatePassword(this.data.oldPassword)
    if (error) {
      this.errors.oldPassword = error
      this.isError = true;
      return this;
    }

    this.result.oldPassword = this.data.oldPassword;
    return this;
  }

  end() {
    if (this.isError) {
      return {
        result: null,
        errors: this.errors,
      };
    }

    return {
      result: this.result,
      errors: null,
    };
  }
}

exports.AccountValidator = AccountValidator;
