const pkg = require("../package.json");

const KEY_USER_ID = exports.KEY_USER_ID = "X-User-Id";
const KEY_CLIENT_TYPE = "X-Client-Type";
const KEY_CLIENT_VERSION = "X-Client-Version";
const KEY_USER_IP = "X-User-Ip";
const KEY_USER_AGENT = "X-User-Agent";
const KEY_UNION_ID = exports.KEY_UNION_ID = "X-Union-Id";

exports.setClientHeader = function(ip, ua) {
  return {
    KEY_CLIENT_TYPE: "web",
    KEY_CLIENT_VERSION: pkg.version,
    KEY_USER_IP: ip,
    KEY_USER_AGENT: ua,
  };
}
