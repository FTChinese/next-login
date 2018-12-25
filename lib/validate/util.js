exports.message = {
  "emailRequired": "邮箱不能为空",
  "emailInvalid": "不是有效的邮箱地址",
  "emailMax": "邮箱过长",
  "emailDuplicate": "如果你要更改邮箱，请勿使用当前邮箱",
  "passwordInvalid": "密码无效",
  "passwordRequired": "密码不能为空",
  "passwordMin": "密码长度太短",
  "passwordMax": "密码过长",
  "passwordsNotEqual": "两次输入的新密码必须相同",
  "familyNameMax": "姓最多允许50个字符",
  "givenNameMax": "名最多允许50个字符",
  "genderInvalid": "请选择正确的性别",
  "dateInvalid": "请按照YYYY-MM-DD格式填写日期",
  "userNameRequired": "用户名不能为空",
  "userNameMax": "用户名不能超过20个字符",
  "mobileRequired": "手机号不能为空",
};

/**
 * Remove spaces of all values of an object.
 * @param {Object} obj 
 */
exports.trimObject = function (obj) {
  for ([key, value] of Object.entries(obj)) {
    if (typeof value !== "string") {
      continue;
    }

    obj[key] = value.trim();
  }

  return obj;
}

/**
 * @param {string} input
 */
const isString = exports.isString = function (input) {
  return (typeof input === 'string' || input instanceof String);
}

/**
 * Convert a string value into boolean.
 * Only "1" or "true" can be converted to true.
 * All other values, regardless of their types, are converted to false.
 */
exports.toBoolean = function(str) {
  /**
   * Expressions that can be converted to false:
	 * null
	 * NaN
	 * 0
	 * emptry string "" or ''
   * undefined
   */
  if (!str) {
    return false;
  }

  if (!isString(str)) {
    return false;
  }

  return str === "1" || str === "true";
}