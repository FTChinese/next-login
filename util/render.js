const path = require('path');
const debug = require("debug")("user:render");
const nunjucks = require('nunjucks');
const util = require('util');
const numeral = require("numeral");
const { DateTime } = require("luxon");
const localized = require("../model/localized");
const alertMsg = {
  "saved": "保存成功！",
  "password_saved": "密码修改成功",
  "email_changed": "邮箱已更新，验证邮件已经发送到您的新邮箱，请及时验证",
  "letter_sent": "验证邮件已发送"
};

const env = nunjucks.configure(
  [
    path.resolve(__dirname, '../view'),
    path.resolve(__dirname, '../client')
  ], 
  {
    noCache: process.env.NODE_ENV === 'development',
    watch: process.env.NODE_ENV === 'development'
  }
);

/**
 * Conert a number to currency string.
 */
env.addFilter("toCurrency", function(num) {
  return numeral(num).format("0,0.00");
});

env.addFilter("localize", function(key) {
  if (localized.hasOwnProperty(key)) {
    return localized[key];
  }

  return key;
});

env.addFilter("showAlert", function(key) {
  if (alertMsg.hasOwnProperty(key)) {
    return alertMsg[key];
  }

  return key;
});

env.addFilter("toCST", function(str) {
  try {
    return DateTime.fromISO(str).setZone("Asia/Shanghai").toFormat("yyyy年LL月dd日 HH:mm:ss")
  } catch (e) {
    debug(e);
    return str
  }
});

module.exports = util.promisify(nunjucks.render);
