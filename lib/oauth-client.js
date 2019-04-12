const {
  URL,
  URLSearchParams,
} = require("url");
const request = require("superagent");
const debug = require("debug")("user:oauth");

const {
  nextApi,
} = require("./endpoints");

class OAuthClient {

  /**
   * @param {IOAuthReq} params
   */
  constructor(params) {
    debug("Authorize parameters: %O", params);
    
    this.authParams = params;
  }

  /**
   * @description Request an oauth code from API.
   * @param {IAccount} param
   * @returns {Promise<{code: string}>}
   */
  async requestCode(account) {
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
        clientId: this.authParams.client_id,
        redirectUri: this.authParams.redirect_uri,
        state: this.authParams.state,
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
    params.set("state", this.authParams.state);

    const redirectTo = new URL(this.authParams.redirect_uri);
    redirectTo.search = params.toString()

    return redirectTo.href;
  }
}

exports.OAuthClient = OAuthClient;

