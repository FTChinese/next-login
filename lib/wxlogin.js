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
  generateState,
} = require("./random");
const time = require("./time");

const {
  nextApi,
  subsApi,
  wxOAuthApi,
} = require("./endpoints");
const {
  KEY_UNION_ID,
  KEY_APP_ID,
} = require("./request");
const {
  viper,
} = require("./config");

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
  }

  async generateState() {
    const state = await generateState();
    return {
      v: state,
      t: time.unixNow(),
    };
  }

  /**
   * @description Test if OAuth state parameter is expired.
   * Its lifetime spans 5 minutes since creation.
   * @param {Object} state 
   * @param {string} state.v
   * @param {number} state.t
   */
  isStateExpired(state) {
    return time.isExpired(state.t, 5 * 60);
  }

  /**
   * @returns {string}
   */
  buildCodeUrl({state, sandbox=false}={}) {

    const redirectUri = subsApi.wxOAuthRedirect(sandbox);

    debug("Wx OAuth redirect uri: %s", redirectUri);

    const params = new URLSearchParams();
    params.set("appid", this.client.app_id);
    params.set("redirect_uri", redirectUri);
    params.set("response_type", "code");
    params.set("scope", "snsapi_login");
    params.set("state", state);

    const redirectTo = new URL(wxOAuthApi.code);
    redirectTo.search = params.toString();

    return redirectTo.href;
  }

  /**
   * @description Use OAuth code to exchange for a IWxSession.
   * @param {string} code 
   * @param {Object} clientApp
   * @returns {IWxSession}
   */
  async getSession(code, clientApp) {
    const resp = await request.post(subsApi.wxLogin)
      .set(clientApp)
      .set(KEY_APP_ID, this.client.app_id)
      .send({code});

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
}

class WxUser {
  constructor(unionId) {
    this.unionId = unionId;
  }

  /**
   * @returns {Promise<IAccount>}
   */
  async fetchAccount() {
    const resp = await request.get(nextApi.wxAccount)
      .set(KEY_UNION_ID, this.unionId);

    return resp.body;
  }

  /**
   * @description Merge wechat account to ftc account.
   * @param {string} ftcId 
   * @returns {boolean}
   */
  async merge(ftcId) {
    const resp = await request.put(nextApi.wxMerge)
      .set(KEY_UNION_ID, this.unionId)
      .send({
        userId: ftcId,
      });

    return resp.noContent;
  }

  /**
   * @param {ICredentials} credentials
   * @param {Object} clientApp 
   * @return {Promise<string>} - user id of the new account.
   */
  async signUp(credentials, clientApp) {
    const resp = await request.post(nextApi.wxSignUp)
      .set(clientApp)
      .set(KEY_UNION_ID, this.unionId)
      .send(credentials);

    /**
     * @type {{id: string}}
     */
    const body = resp.body;
    return body.id;
  } 
}

exports.wxOAuth = new WxOAuth(wxApp);
exports.WxUser = WxUser;
exports.WxSession = WxSession;
