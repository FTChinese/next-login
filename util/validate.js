const Joi = require('joi');

/**
 * 
 * @param {Joi.ValidationError} err 
 * @return {Object}
 */
function buildError(err) {
  const errors = {};
  for (item of err.details) {
    const key = item.path.join("_");
    const msgKey = `${key}_${item.type}`
    errors[key] = item.message;
  }

  return errors;
}
/**
 * @param {Credentials} credentials
 */
exports.validateLogin = async function(credentials) {
  const schema = Joi.object().keys({
    email: Joi.string().trim().email().min(3).max(254).required(),
    password: Joi.string().trim().min(8).max(128).required()
  });

  try {
    /**
     * @type {Credentials}
     */
    const result = await Joi.validate(credentials, schema, {abortEarly: false});

    return {
      result,
      errors: null
    };
  } catch (e) {
    if (!e.isJoi) {
      throw e;
    }

    return {
      result: null,
      errors: buildError(e)
    }
  }
}