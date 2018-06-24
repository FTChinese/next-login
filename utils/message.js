const passwordRequired = "密码不能为空";
const passwordMin = "密码长度太短(最少8个字符)";
const passwordMax = "密码太长了";
const tokenInvalid = "您似乎使用了无效的重置密码链接，请重试";

module.exports = {
    "credentials.not_found": "邮箱或密码错误",
    "email.any.required": "邮箱不能为空",
    "email.string.email": "不是有效的邮箱地址",
    "email.already_exists": "账号已经存在",
    "email.not_found": "该邮箱不存在，请检查您输入的邮箱是否正确",
    // "email.invalid": "不是有效的邮箱地址",
    // "email.missing_field": "邮箱不能为空",
    "password.any.required": passwordRequired,
    "password.string.min": passwordMin,
    "password.string.max": passwordMax,
    "confirmPassword.any.required": "确认密码不能为空",
    "confirmPassword.string.min": passwordMin,
    "confirmPassword.string.max": passwordMax,
    "confirmPassword.mismatched": "两次输入的密码不符，请重新输入",
    // "password.invalid": "密码包含非法字符",
    // "password.missing_field": "密码不能为空",
    "token.not_found": tokenInvalid,
    "reset.forbidden": `无法重置密码。${tokenInvalid}`,
    "server.error": "服务器开小差了，请稍后再试"
}