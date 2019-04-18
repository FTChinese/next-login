/**
 * @description Returns the current Unix time, the number of seconds elapsed since January 1, 1970 UTC
 * @return {number}
 */
const unixNow = exports.unixNow = function() {
  return Math.trunc(Date.now()/1000);
}

/**
 * @description Test if a unix timestamp is expired up to now.
 * @param {number} timestamp
 * @param {number} duration
 * @return {boolean}
 */
exports.isExpired = function(timestamp, duration) {
  if (!timestamp || !duration) {
    return true;
  }
  const elapsed = unixNow() - timestamp;

  if (elapsed > duration || elapsed < 0) {
    return true;
  }

  return false
}
