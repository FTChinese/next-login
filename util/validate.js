const Joi = require("joi");
const debug = require("debug")("validate");

const messages = {
  "email_any.required": "邮箱不能为空",
  "email_string.min": "",
  "email_string.max": "",
  "email_string.email": "不是有效的邮箱地址",
  "password_any.required": "密码不能为空",
  "password_string.min": "密码长度太短(最少8个字符)",
  "password_string.max": "密码太长了",
  "confirmPassword_any.required": "确认密码不能为空",
  "confirmPassword_string.min": "确认密码长度太短(最少8个字符)",
  "confirmPassword_string.max": "确认密码太长了",
  "confirmPassword_mismatched": "两次输入的密码不符，请重新输入"
}
/**
 * 
 * @param {Joi.ValidationError} err 
 * @return {Object}
 */
function buildError(err) {
  const errors = {};

  console.log(err.details);

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
    email: Joi.string().trim().email().min(3).max(256).required(),
    password: Joi.string().trim().max(128).required()
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
    debug("%O", e);

    if (!e.isJoi) {
      throw e;
    }

    return {
      result: null,
      errors: buildError(e)
    }
  }
}