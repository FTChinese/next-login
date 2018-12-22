const pkg = require("../package.json");

exports.customHeader = function(ip, ua) {
  return {
    "X-Client-Type": "web",
    "X-Client-Version": pkg.version,
    "X-User-Ip": ip,
    "X-User-Agent": ua,
  };
}