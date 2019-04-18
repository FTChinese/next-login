const {
  URL,
  URLSearchParams,
} = require("url");
const request = require("superagent");
const debug = require("debug")("user:oauth");
const {
  isProduction
} = require("./config");

const {
  nextApi,
} = require("./endpoints");

/**
 * @description Handle FTC OAuth request.
 */
class OAuthServer {

  /**
   * @param {IOAuthReq} params
   */
  constructor(params) {
    debug("Authorize parameters: %O", params);
    
    this.params = params;
  }

  get clientId() {
    return this.params.client_id;
  }

  get responseType() {
    return this.params.response_type;
  }

  get redirectUri() {
    return this.params.redirect_uri;
  }

  get state() {
    return this.params.state;
  }

  validateRequest() {
    // client_id
    const clientId = this.params.client_id;
    if (!clientId) {
      return {
        error: "invalid_request",
        error_description: "参数缺失: client_id",
        shouldRedirect: false,
      };
    }

    // redirect_uri
    const redirectURI = this.params.redirect_uri;
    if (!redirectURI) {
      return {
        error: "invalid_request",
        error_description: "参数缺失: redirect_uri",
        shouldRedirect: false,
      }
    }

    try {
      const callbackURL = new URL(redirectURI);
      // Only checks hostname in production.
      if (isProduction && callbackURL.hostname != "www.ftacademy.cn") {
        return {
          error: "unauthorized_client",
          error_description: `client_id: ${this.params.client_id} 无权执行此操作`,
          shouldRedirect: false,
        }
      }
    } catch(e) {
      debug("Cannot parse url: %O", e);

      return {
        error: "invalid_request",
        error_description: "无效的回调地址",
        shouldRedirect: false,
      }
    }

    // reponse_type
    const responseType = this.params.response_type;
    if (!responseType) {
      return  {
        error: "invalid_request",
        error_description: "参数缺失: responst_type",
        shouldRedirect: true,
      }
    }

    if (responseType != "code") {
      return {
        error: "unsupported_response_type",
        error_description: "response_type 不支持",
        shouldRedirect: true,
      };
    }

    // state
    if (!this.params.state) {
      return {
        error: "invalid_request",
        error_description: "参数缺失: state",
        shouldRedirect: true,
      }
    }

    return null;
  }

  buildErrRedirect({error, error_description}={}) {
    const params = new URLSearchParams();
    params.set("error", error);

    if (error_description) {
      params.set("error_description", error_description)
    }

    if (this.params.state) {
      params.set("state", this.params.state);
    }

    return `${this.params.redirect_uri}?${params.toString()}`;
  }

  /**
   * @description Request an oauth code from API.
   * @param {IAccount} param
   * @returns {Promise<{code: string}>}
   */
  async createCode(account) {
    let userId;
    switch (account.loginMethod) {
      case "email":
        userId = account.id;
        break;

      case "wechat":
        userId = account.unionId;
        break;

      default:
        throw new Error("unknow login method");
    }

    const resp = await request.post(nextApi.oauthCode)
      .send({
        clientId: this.params.client_id,
        redirectUri: this.params.redirect_uri,
        state: this.params.state,
        userId,
        loginMethod: account.loginMethod
      });

    return resp.body;
  }

  /**
   * @description Build the redirect url to caller with code attached.
   * @param {string} code - The authorization code returned form API
   * @returns {string}
   */
  buildRedirect(code) {
    const params = new URLSearchParams();
    params.set("code", code);
    params.set("state", this.params.state);

    const redirectTo = new URL(this.params.redirect_uri);
    redirectTo.search = params.toString()

    return redirectTo.href;
  }
}

module.exports = OAuthServer;

