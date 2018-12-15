const validator = require("validator");
const trimObject = require("./trim-object");

class CredentialsValidator {
  /**
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @param {boolean} isCompatible - A switch indicating whether the validation should be backward compatible. True when used for login, false when user is changing password
   */
  constructor(credentials, isCompatible = false) {
    this.isCompatible = isCompatible;
    this.errors = {};
    this.result = {};
    this.isError = false;

    /**
     * @type {{login: string, password: string}}
     */
    this.credentials = trimObject(credentials)
  }

  /**
   *  Joi.string().trim().email().min(3).max(254).required()
   */
  verifyEmail() {
    if (!validator.isEmail(this.credentials.email)) {
      this.errors.email = "不是有效的邮箱地址";
      this.isError = true;
      return;
    }
    
    if (!validator.isLength(this.credentials.email, {min: 3})) {
      this.errors.email = "邮箱不能为空";
      this.isError = true;
      return;
    }

    if (!validator.isLength(this.credentials.email, {max: 50})) {
      this.errors.email = "邮箱地址过长";
      this.isError = true;
      return;
    }

    this.result.email = this.credentials.email;
  }

  /**
   * Joi.string().trim().min(8).max(128).required()
   */
  verifyPassword() {
    const minLength = this.isCompatible ? 6 : 8;
    if (!validator.isLength(this.credentials.password, {min: minLength})) {
      this.errors.password = `密码最少${minLength}位字符`;
      this.isError = true;
      return;
    }
    if (!validator.isLength(this.credentials.password, {max: 128})) {
      this.errors.password = "密码过长";
      this.isError = true;
      return;
    }
    this.result.password = this.credentials.password;
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
