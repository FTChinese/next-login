const request = require("superagent");
const debug = require("debug")("user:account");

const {
  nextApi,
} = require("./endpoints");

const KEY_USER_ID = exports.KEY_USER_ID = "X-User-Id";
exports.KEY_UNION_ID = "X-Union-Id";
exports.KEY_APP_ID = "X-App-Id";

class Credentials {
  /**
   * @param {string} email 
   * @param {string} password 
   */
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }

  /**
   * @param {Object} clientApp
   * @returns {Promise<IAccount>}
   */
  async login(clientApp) {
    const authResp = await request
    .post(nextApi.login)
    .set(clientApp)
    .send({
      email: this.email,
      password: this.password,
    });

    /**
     * @type {{id: string}}
     */
    const user = authResp.body;
    const resp = await request
      .get(nextApi.account)
      .set(KEY_USER_ID, user.id);

    return resp.body;
  }

  /**
   * @param {Object} clientApp 
   * @returns {Promise<IAccount>}
   */
  async signUp(clientApp) {
    const idResp = await request.post(nextApi.signup)
    .set(clientApp)
    .send({
      email: this.email,
      password: this.password,
    });

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

class ForgotPassword {
  /**
   * 
   * @param {string} email
   * @returns {Promise<void>}
   */
  static sendResetLetter(email, clientApp) {
    return request
      .post(nextApi.passwordResetLetter)
      .set(clientApp)
      .send({ email });
  }

  /**
   * @param {string} token 
   * @returns {Promise<string>}
   */
  static async verifyToken(token) {
    const resp = await request
      .get(nextApi.passwordResetToken(token));

    /**
     * @type {{email: string}}
     */
    const body = resp.body;
    return body.email;
  }

  static reset(token, password) {
    return request
      .post(nextApi.resetPassword)
      .send({
        token,
        password,
      });
  }
}

class Verification {
  constructor(token) {
    this.token = token;
  }

  /**
   * @returns {Promise<void>}
   */
  email() {
    return request
      .put(nextApi.verifyEmail(this.token));
  }
}

exports.Credentials = Credentials;
exports.ForgotPassword = ForgotPassword;
exports.Verification = Verification;
