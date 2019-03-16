const pkg = require("../package.json");

const KEY_USER_ID = exports.KEY_USER_ID = "X-User-Id";
const KEY_CLIENT_TYPE = "X-Client-Type";
const KEY_USER_IP = "X-User-Ip";
const KEY_USER_AGENT = "X-User-Agent";
const KEY_UNION_ID = "X-Union-Id";

exports.setClientHeader = function(ip, ua) {
  return {
    "X-Client-Type": "web",
    "X-Client-Version": pkg.version,
    "X-User-Ip": ip,
    "X-User-Agent": ua,
  };
}

exports.setUserId = function(id) {
  return {
    "X-User-Id": id
  }
}

exports.setUserOrUnionId = function(userId, unionId) {
  if (userId && unionId) {
    return {
      "X-User-Id": userId,
      "X-Union-Id": unionId
    };
  }

  if (userId) {
    return {
      "X-User-Id": userId,
    };
  }

  if (unionId) {
    return {
      "X-Union-Id": unionId,
    };
  }

  return {};
}
