const isProduction = process.env.NODE_ENV === "production";
const fs = require("fs");
const path = require("path");
const toml = require("toml");

console.log(`Current environment: ${process.env.NODE_ENV}. URL prefix: ${process.env.URL_PREFIX}`);

/**
 * @description Get configuration from toml file.
 * This is a mimic for golang pkg viper.
 */
class Viper {
  constructor() {
  }

  /**
   * @description Set the configuration file path
   */
  setConfigPath(filePath) {
    this.filePath = filePath;
    return this;
  }

  setConfigName(fileName) {
    this.fileName = fileName;
    return this;
  }

  readInConfig() {
    const configFile = path.resolve(this.filePath, this.fileName);
    this.config = toml.parse(fs.readFileSync(configFile, "utf-8"));
    return this;
  }

  getConfig() {
    return this.config;
  }
}

exports.isProduction = isProduction;
exports.urlPrefix = process.env.URL_PREFIX || "";
exports.baseUrl = {
  getSubsApi: function(sandbox=false) {

    if (sandbox) {
      return "http://www.ftacademy.cn/api/sandbox";
    }

    return isProduction
      ? "http://www.ftacademy.cn/api/v1"
      : "http://localhost:8200";
  },
  getNextApi: function() {
    if (isProduction) {
      return "http://api.ftchinese.com/v1";
    } else {
      return "http://localhost:8000";
    }
  }
};

exports.viper = new Viper();
