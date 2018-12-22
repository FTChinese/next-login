const msg = exports.errMessage = {
  "email_missing_field": "邮箱不能为空",
  "email_invalid": "不是有效的邮箱地址",
  "email_already_exists": "账号已经存在",
  "email_not_found": "该邮箱不存在，请检查您输入的邮箱是否正确",
  "password_missing_field": "密码不能为空",
  "password_invalid": "无效的密码",
  "password_token_invalid": "您似乎使用了无效的重置密码链接，请重试",
  "token_mising_field": "token不能为空",
  "token_invalid": "无效的token"
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
      server: body.message
    }
  }

  const field = body.error.field
  const key = `${body.error.field}_${body.error.code}`
  return {
    [field]: msg[key] || body.message
  };
}