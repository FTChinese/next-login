const { toBoolean } = require("./util");

/**
 * @param {Newsletter} newsletter
 */
exports.validateNewsletter = function(newsletter) {
  const result = {};
  for (const [key, value] of Object.entries(this.data)) {
    this.result[key] = toBoolean(value);
  }

  return result;
}