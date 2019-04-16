const isProduction = process.env.NODE_ENV === "production";
const fs = require("fs");
const path = require("path");
const toml = require("toml");

console.log(`Current environment: ${process.env.NODE_ENV}. URL prefix: ${process.env.URL_PREFIX}`);

/**
 * @description Get urls for varous apps based on runtime env.
 */
class BaseUrl {
  constructor() {
    this._subsApi = null;
    this._nextApi = null;
    this._nextUser = null;
    this._wxCallbackPath = null;
  }

  getSubsApi() {
    if (this._subsApi) {
      return this._subsApi;
    }

    switch (process.env.NODE_ENV) {
      case "sandbox":
        this._subsApi = "http://www.ftacademy.cn/api/sandbox";

      case "production":
        this._subsApi = "http://www.ftacademy.cn/api/v1";

      default:
        this._subsApi = "http://localhost:8200";
    }

    return this._subsApi
  }

  getNextApi() {
    if (this._nextApi) {
      return this._nextApi;
    }

    if (isProduction) {
      this._nextApi = "http://api.ftchinese.com/v1";
    } else {
      this._nextApi = "http://localhost:8000";
    }

    return this._nextApi;
  }
}

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
exports.baseUrl = new BaseUrl();
exports.viper = new Viper();
