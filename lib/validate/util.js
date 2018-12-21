exports.message = {
  "emailRequired": "邮箱不能为空",
  "emailInvalid": "不是有效的邮箱地址",
  "emailMax": "邮箱过长",
  "passwordRequired": "密码不能为空",
  "passwordMin": "密码长度太短(最少8个字符)",
  "passwordMax": "密码过长"
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