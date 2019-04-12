const {
  URL,
  URLSearchParams,
} = require("url");
const {
  DateTime,
} = require("luxon");
const request = require("superagent");
const debug = require("debug")("user:wxlogin");

const {
  nextApi,
  subsApi,
  wxOAuth,
} = require("./endpoints");
const {
  KEY_UNION_ID,
  KEY_APP_ID,
} = require("./request")
const {
  baseUrl,
  viper,
} = require("./config")

const wxApp = viper.getConfig().wxapp.w_ftc;

/**
 * @description Wx login client.
 */
class WxOAuth {
  /**
   * @param {IWxApp} app 
   */
  constructor(app) {
    this.client = app;
    this.redirectUri = `${this.client.redirect_uri}/${baseUrl.getWxCallbackPath()}`;
  }

  /**
   * @returns {string}
   */
  buildCodeUrl(state) {
    const params = new URLSearchParams();
    params.set("appid", this.client.app_id);
    params.set("redirect_uri", this.redirectUri);
    params.set("response_type", "code");
    params.set("scope", "snsapi_login");
    params.set("state", state);

    const redirectTo = new URL(wxOAuth.code);
    redirectTo.search = params.toString();

    return redirectTo.href;
  }

  /**
   * @description Use OAuth code to exchange for a IWxSession instance.
   * @param {string} code 
   * @param {Object} clientApp
   * @returns {IAccount}
   */
  async login(code, clientApp) {
    const sessResp = await request.post(subsApi.wxLogin)
      .set(clientApp)
      .set(KEY_APP_ID, this.client.app_id)
      .send({code});

    /**
     * @type {IWxSession}
     */
    const wxSess = sessResp.body;

    const resp = await request.get(nextApi.wxAccount)
      .set(clientApp)
      .set(KEY_UNION_ID, wxSess.unionId)

    return resp.body;
  }
}

/**
 * @description This is a port of Android version
 * WxSession.
 */
class WxSession {
  /**
   * @param {IWxSession} sess
   */
  constructor(sess) {
    this.id = sess.id;
    this.unionId = sess.unionId;
    this.createdAt = sess.createdAt;
  }

  /**
   * @returns {boolean}
   */
  isExpired() {
    const created = DateTime.fromISO(this.createdAt);
    const expireAt = created.plus({days: 30});
    
    return expireAt > DateTime.utc();
  }

  /**
   * A stub implementation.
   * I do not think web needs refresing wechat data since session is not as long as the storage in native app.
   */
  async refresh() {

  }

  /**
   * @param {Object} clientApp
   * @returns {Promise<IAccount>}
   */
  async fetchAccount(clientApp) {
    const resp = await request.get(nextApi.wxAccount)
      .set(clientApp)
      .set(KEY_UNION_ID, this.unionId);

    return resp.body;
  }
}

exports.wxOAuth = new WxOAuth(wxApp);
exports.WxSession = WxSession;
exports.mockWxSession = new WxSession({
  id: "3ab0551980",
  unionId: "tvSxA7L6cgl8nwkrScm_yRzZoVTy",
  createdAt: DateTime.utc().toISO({suppressMilliseconds: true}),
});
