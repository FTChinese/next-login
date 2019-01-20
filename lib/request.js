const pkg = require("../package.json");

exports.customHeader = function(ip, ua) {
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