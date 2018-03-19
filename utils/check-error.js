const _ = require('lodash');

/**
 * Response errors structure
 * [
 *  {
 *    resource: "",
 *    field: "",
 *    code: "missing | missing_field | invalid | already_exists"
 *  }
 * ]
 */
const errorCodes = {
  MISSING: "missing",
	MISSING_FIELDS: "missing_field",
	INVALID: "invalid",
	ALREAD_EXISTS: "already_exists"
}

/**
 * @param {string} field 
 * @param {Object[]} errors
 */
exports.isAlradyExists = function (field, errors) {
  const index = _.findIndex(errors, (o) => {
    return o.field === field && o.code === errorCodes.ALREAD_EXISTS;
  });

  return index > -1 ? true : false;
};