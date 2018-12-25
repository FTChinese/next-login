const validator = require("validator");
const { trimObject, message } = require("./util");

class ProfileValidator {
  /**
   * 
   * @typedef {Object} Profile
   * @property {string} [userName]
   * @property {string} [mobile]
   * @property {string} [familyName]
   * @property {string} [givenName]
   * @property {string} [gender]
   * @property {string} [birthday]
   * 
   * @param {Profile} profile
   */
  constructor(profile) {
    /**
     * @type {Profile}
     */
    this.errors = {}

    /**
     * @type {Profile}
     */
    this.result = {}
    this.isError = false;

    /**
     * @type {Profile}
     */
    this.data = trimObject(profile);
  }

  mobile() {
    if (validator.isEmpty(this.data.mobile)) {
      this.errors.mobile = message.mobileRequired;
      this.isError = true;

      return this;
    }

    this.result.mobile = this.data.mobile;
    return this;
  }

  familyName() {
    if (validator.isEmpty(this.data.familyName)) {
      this.result.familyName = null;
      return this;
    }

    if (!validator.isLength(this.data.familyName, {max: 50})) {
      this.errors.familyName = message.familyNameMax;
      this.isError = true;
      return this;
    }

    this.result.familyName = this.data.familyName;
    return this;
  }

  givenName() {
    if (validator.isEmpty(this.data.givenName) ) {
      this.result.givenName = null;
      return this;
    }

    if (!validator.isLength(this.data.givenName, {max: 50})) {
      this.errors.givenName = message.givenNameMax;
      this.isError = true
      return this;
    }
    this.result.givenName = this.data.givenName;
    return this;
  }

  gender() {
    if (validator.isEmpty(this.data.gender)) {
      this.result.gender = null;
      return this;
    }

    switch (this.data.gender) {
      case "F":
      case "M":
        this.result.gender = this.data.gender;
        break;

      default:
        this.errors.gender = message.genderInvalid;
        this.isError = true;
        break;
    }

    return this;
  }

  birthday() {
    if (validator.isEmpty(this.data.birthday)) {
      this.result.birthday = null;
      return this;
    }

    if (!validator.isISO8601(this.data.birthday)) {
      this.errors.birthday = message.dateInvalid;
      this.isError = true;
      return this;
    }

    this.result.birthday = this.data.birthday;

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

exports.ProfileValidator = ProfileValidator;