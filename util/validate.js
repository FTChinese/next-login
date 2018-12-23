const Joi = require("joi");
const debug = require("debug")("validate");

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