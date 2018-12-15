const validator = require("validator");
const trimObject = require("./trim-object");

class CredentialsValidator {
  /**
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   */
  constructor(credentials) {
    this.errors = {};
    this.result = {};
    this.isError = false;

    /**
     * @type {{login: string, password: string}}
     */
    this.credentials = trimObject(credentials)
  }

  verifyEmail() {
    if (!validator.isEmail(this.credentials.email)) {
      this.errors.email = "不是有效的邮箱地址";
      this.isError = true;
      return;
    }
  }

  verifyPassword() {

  }

  validate() {

  }
}
