const request = require("superagent");
const debug = require("debug")("user:credentials");

const {
  nextApi,
} = require("./endpoints");

const {
  KEY_USER_ID,
} = require("./request");
const {
  isAPIError,
} = require("./response");

class Credentials {
  /**
   * @param {ICredentials} credentials 
   */
  constructor(credentials) {
    this._credentials = credentials;
  }

  /**
   * @param {string} email 
   * @returns {boolean}
   */
  async emailExists() {
    const query = new URLSearchParams({
      k: "email",
      v: this._credentials.email,
    }).toString();

    const url = new URL(nextApi.exists);
    url.search = query;

    try {
      const resp = await request.get(url.href);

      return resp.noContent;
    } catch (e) {
      if (!isAPIError(e)) {
        throw e;
      }

      if (e.status == 404) {
        return false;
      }

      throw e;
    }
  }

  /**
   * @description Authenticate and returns user's uuid if passed.
   * @param {Object} clientApp 
   * @returns {Promise<string>}
   */
  async authenticate(clientApp) {
    const resp = await request
      .post(nextApi.login)
      .set(clientApp)
      .send(this._credentials);

    /**
     * @type {{id: string}}
     */
    const body = resp.body;

    return body.id;
  }

  /**
   * @param {Object} clientApp
   * @returns {Promise<IAccount>}
   */
  async login(clientApp) {

    const userId = await this.authenticate(clientApp);

    const resp = await request
      .get(nextApi.account)
      .set(KEY_USER_ID, userId);

    return resp.body;
  }

  /**
   * @param {Object} clientApp 
   * @returns {Promise<IAccount>}
   */
  async signUp(clientApp) {
    const idResp = await request.post(nextApi.signup)
      .set(clientApp)
      .send(this._credentials);

    /**
     * @type {{id: string}}
     */
    const user = idResp.body;
    const resp = await request
      .get(nextApi.account)
      .set(KEY_USER_ID, user.id);

    return resp.body;
  }
}

module.exports = Credentials;
