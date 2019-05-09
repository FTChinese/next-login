const debug = require("debug")("user:api-error");

const msg = exports.errMessage = {
  "credentials_invalid": "邮箱或密码错误",
  "email_missing_field": "邮箱不能为空",
  "email_invalid": "不是有效的邮箱地址",
  "email_already_exists": "该邮箱已经注册FT中文网账号，请使用其他邮箱",
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
  "userName_already_exists": "用户名已被占用，请使用其他用户名",
  "mobile_missing_field": "手机号码不能为空",
  "mobile_invalid": "手机号码无效",
  "server_unauthorized": "访问被拒绝，无权进行此操作",
  "too_many_requests": "您创建账号过于频繁，请稍后再试",
  "userId_missing_field": "请求中缺少'userId'字段",
  // Gift card error response.
  "redeem_code_not_found": "没有找到该卡号，请确认您输入的礼品卡号有效、没有过期、未被激活",
  "redeem_code_missing_field": "兑换码缺失",
  "member_already_exists": "您已经是会员了"
};

class ClientError {
  /**
   * 
   * @param {Error} err 
   * @param {number} err.status
   * @param {SuperAgentResponse} err.response
   */
  constructor(err) {
    this.error = err;
  }

  isFromAPI () {
    if (this.error.status && this.error.response) {
      return true;
    }
    return false;
  }

  /**
   * @description Build human readable error message from API response that does not target any forms.
   * Currently this message is shown as a top banner.
   * @return {{message: string}}
   */
  buildGenericError() {
    const body = this.error.response.body;

    if (!body.error) {
      return {
        message: body.message,
      };
    }

    const key = `${body.error.field}_${body.error.code}`

    return {
      message: msg[key] || body.message,
    }
  }

  /**
   * @description Build a map of error messages that could be used under each `input` element.
   * The key is the value of API's `error.code` field.
   */
  buildFormError() {
    /**
     * @type {APIError}
     */
    const body = this.error.response.body;

    debug("API error: %O", body);

    /**
     * @description If the response does not contain `error` field, similar to `buildGenericError`.
     * This is a fallback.
     */
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
}

exports.ClientError = ClientError;
