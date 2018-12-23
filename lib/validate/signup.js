const validator = require("validator");
const { trimObject, message } = require("./util");

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
    if (validator.isEmpty(this.signup.email)) {
      this.errors.email = message.emailRequired;
      this.isError = true;
      return;
    }

    if (!validator.isEmail(this.signup.email)) {
      this.errors.email = message.emailInvalid;
      this.isError = true;
      return;
    }

    if (!validator.isLength(this.signup.email, {max: 50})) {
      this.errors.email = message.emailMax;
      this.isError = true;
      return;
    }

    this.result.email = this.signup.email;
  }

  password() {
    if (validator.isEmpty(this.signup.password)) {
      this.errors.password = message.passwordRequired;
      this.isError = true;
      return;
    }

    if (!validator.isLength(this.signup.password, {min: 8})) {
      this.errors.password = message.passwordMin;
      this.isError = true;
      return;
    }
    
    if (!validator.isLength(this.signup.password, {max: 128})) {
      this.errors.password = message.passwordMax;
      this.isError = true;
      return;
    }

    this.result.password = this.signup.password;
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

exports.SignupValidator = SignupValidator;