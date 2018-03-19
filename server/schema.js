const Joi = require('joi');

const keys = {
  email: Joi.string().trim().email().min(3).max(30).required(),
  password: Joi.string().trim().min(8).max(20).required()
};

exports.email = Joi.object().keys({
  email: keys.email
});

exports.changeEmail = Joi.object().keys({
  current: keys.email,
  new: keys.email
});

exports.changePassword = Joi.object().keys({
  currentPassword: keys.password,
  password: keys.password,
  passwordConfirmation: keys.password
})

exports.credentials = Joi.object().keys({
  email: keys.email,
  password: keys.password
});

exports.reset = Joi.object().keys({
  password: keys.password,
  passwordConfirmation: keys.password
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
