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

exports.profile = Joi.object().keys({
  familyName: Joi.string().trim().min(1).max(10),
  givenName: Joi.string().trim(),
  gender: Joi.string().trim(),
  birthdate: Joi.string().trim()
});

exports.username = Joi.object().keys({
  oldName: Joi.string().trim(),
  name: Joi.string().trim().min(1).max(20).required()
});

exports.mobile = Joi.object().keys({
  oldMobileNumber: Joi.string().trim(),
  mobileNumber: Joi.string().trim().min(1).required()
});

exports.letter = Joi.object().keys({
  todayFocus: Joi.boolean(),
  weeklyChoice: Joi.boolean(),
  afternoonExpress: Joi.boolean()
});

exports.address = Joi.object().keys({
  address: Joi.string().trim(),
  zipCode: Joi.string().trim()
})
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
