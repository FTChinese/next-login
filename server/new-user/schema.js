const Joi = require('joi');

exports.login = Joi.object().keys({
  email: Joi.string().trim().email().max(80).required(),
  password: Joi.string().trim().min(8).max(20).required(),
});