const validator = require("validator");
const { trimObject, message } = require("./util");

/**
 * @typedef {Object} Address
 * @property {string} province
 * @property {string} city
 * @property {string} district
 * @property {string} street
 * @property {string} postcode
 */
class AddressValidator {
  /**
   * @param {Address} address 
   */
  constructor(address) {
    /**
     * @type {Address}
     */
    this.errors = {};
    /**
     * @type {Address}
     */
    this.result = {};
    this.isError = false;

    /**
     * @type {Address}
     */
    this.data = trimObject(address);
  }

  validate() {
    for (const [key, value] of Object.entries(this.data)) {
      if (!validator.isLength(value, {max: 256})) {
        this.errors[key] = "太长";
        this.isError = true;
        continue;
      }

      if (validator.isEmpty(value)) {
        this.result[key] = null;
        continue;
      }

      this.result[key] = value;
    }

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

exports.AddressValidator = AddressValidator;