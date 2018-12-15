function isString(input) {
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