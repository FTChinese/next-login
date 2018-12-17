const validator = require("validator");
const trimObject = require("./trim-object");

class SignupValidator {
  /**
   * @param {Credentials} signup 
   */
  constructor(signup) {
    this.errors = {};
    this.result = {};
    this.isError = false;

    /**
     * @type {{email: string, password: string}}
     */
    this.signup = trimObject(signup);
  }

  email() {
    if (!validator.isEmpty(this.login.email)) {
      this.errors.email = "邮箱不能为空";
      this.isError = true;
      return;
    }

    if (!validator.isEmail(this.login.email)) {
      this.errors.email = "不是有效的邮箱地址";
      this.isError = true;
      return;
    }

    if (!validator.isLength(this.credentials.email, {max: 50})) {
      this.errors.email = "邮箱地址过长";
      this.isError = true;
      return;
    }

    this.result.email = this.signup.email;
  }

  password() {
    if (!validator.isEmpty(this.login.password)) {
      this.errors.password = "密码不能为空";
      this.isError = true;
      return;
    }

    if (!validator.isLength(this.login.password, {min: 1, max: 128})) {
      this.errors.password = `密码过长`;
      this.isError = true;
      return;
    }

    this.result.password = this.login.password;
  }

  validate() {
    this.email();
    this.password();

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