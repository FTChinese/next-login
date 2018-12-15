/**
 * Remove spaces of all values of an object.
 * @param {Object} obj 
 */
module.exports = function trimObject(obj) {
  for ([key, value] of Object.entries(obj)) {
    if (typeof value !== "string") {
      continue;
    }

    obj[key] = value.trim();
  }

  return obj;
}