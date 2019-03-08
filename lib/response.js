const msg = exports.errMessage = {
  "credentials_invalid": "邮箱或密码错误",
  "email_missing_field": "邮箱不能为空",
  "email_invalid": "不是有效的邮箱地址",
  "email_already_exists": "账号已经存在",
  "email_not_found": "该邮箱不存在，请检查您输入的邮箱是否正确",
  "email_token_not_found": "您使用了无效的邮箱验证链接",
  "password_missing_field": "密码不能为空",
  "password_invalid": "密码无效",
  "password_token_invalid": "无法重置密码。您似乎使用了无效的重置密码链接，请重试",
  "password_forbidden": "当前密码错误",
  "passwords_mismatched": "两次输入的密码不符，请重新输入",
  "token_mising_field": "token不能为空",
  "token_invalid": "无效的token",
  "userName_missing_field": "用户名不能为空",
  "userName_invalid": "用户名无效",
  "userName_already_exists": "用户名已经存在",
  "mobile_missing_field": "手机号码不能为空",
  "mobile_invalid": "手机号码无效",
  "server_unauthorized": "访问被拒绝，无权进行此操作",
  "too_many_requests": "您创建账号过于频繁，请稍后再试",
};

/**
 * @param {Object} err
 * @param {status} [err.number]
 * @param {Object} [err.response]
 * @return {boolean}
 */
exports.isAPIError = function (err) {
  if (err.status && err.response) {
    return true;
  }
  return false;
};

/**
 * Convert API error response body to a structure that can be shown on UI.
 * Hanlde HTTP status code 400, 422.
 * @param {APIError} body
 * @returns {ErrorForUI}
 */
exports.buildApiError = function (body) {
  if (!body.error) {
    return {
      message: body.message
    }
  }

  const field = body.error.field
  const key = `${body.error.field}_${body.error.code}`
  return {
    [field]: msg[key] || body.message
  };
}

/**
 * @param {Error} error
 */
exports.buildErrMsg = function (error) {
  return {
    message: error.message,
  };
}
