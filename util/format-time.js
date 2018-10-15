const moment = require('moment');

const LAYOUT_ISO8601 = "YYYY-DD-MMTHH:mm:ssZ";

const LAYOUT_CST = "YYYY年MM月DD日"
exports.iso8601ToDate = function(str) {
  if (!str) {
    return "";
  }
  
  return moment(str).utcOffset(8).format(LAYOUT_CST);
}