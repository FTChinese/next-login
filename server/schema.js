const Joi = require('joi');

exports.credentials = Joi.object().keys({
  email: Joi.string().trim().email().min(3).max(30).required(),
  password: Joi.string().trim().min(8).max(20).required()
});

/**
 * @param {Object} err
 * @param {boolean} err.isJoi
 * @param {string} err.name=ValidationError
 * @param {Object[]} err.details
 * @param {string} err.details.message
 * @param {string[]} err.details.path
 * @param {string} err.details.type
 * @param {Object} err.details.context
 * @param {number} err.details.context.limit
 * @param {number} err.details.context.value
 * @param {string} err.details.context.key
 * @param {string} err.details.context.label
 * @return {Object}
 */
exports.gatherErrors = function (err) {
  if (!err.isJoi || err.name !== 'ValidationError') {
    return null;
  }

  return err.details.reduce((acc, cur) => {
    acc[cur.context.key] = cur.message;
    return acc;
  }, {});
};
