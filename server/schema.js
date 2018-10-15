const Joi = require('joi');

const email = Joi.string().trim().email().min(3).max(254).required();
const password = Joi.string().trim().min(8).max(128).required();

exports.login = Joi.object().keys({
  email,
  password: Joi.string().trim().required()
});

exports.account = Joi.object().keys({
  email,
  password
});

exports.reset = Joi.object().keys({
  password,
  confirmPassword: password
});

exports.profile = Joi.object().keys({
  familyName: Joi.string().trim().max(50).allow('').default(null),
  givenName: Joi.string().trim().max(50).allow('').default(null),
  gender: Joi.string().trim().valid(['M', 'F', '']).default(null),
  birthdate: Joi.string().trim().min(8).max(10).allow('').default(null)
});

exports.email = Joi.object().keys({
  email
});

exports.changeEmail = Joi.object().keys({
  oldEmail: email,
  email
});

exports.newsletter = Joi.object().keys({
  todayFocus: Joi.boolean().default(false),
  weeklyChoice: Joi.boolean().default(false),
  afternoonExpress: Joi.boolean().default(false),
});

exports.changePassword = Joi.object().keys({
  oldPassword: Joi.string().trim().required(),
  password,
  confirmPassword: password
});

exports.username = Joi.object().keys({
  userName: Joi.string().trim().min(1).max(20).required()
});

exports.mobile = Joi.object().keys({
  mobile: Joi.string().trim().min(1).required()
});

exports.address = Joi.object().keys({
  province: Joi.string().trim().allow(''),
  city: Joi.string().trim().allow(''),
  district: Joi.string().trim().allow(''),
  street: Joi.string().trim().allow(''),
  zipCode: Joi.string().trim().allow(''),
});
