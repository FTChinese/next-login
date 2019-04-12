const request = require("superagent");
const debug = require("debug")("user:account");

const {
  nextApi,
} = require("./endpoints");

const KEY_USER_ID = exports.KEY_USER_ID = "X-User-Id";
exports.KEY_UNION_ID = "X-Union-Id";
exports.KEY_APP_ID = "X-App-Id";

/**
 * @description FtcUser wraps an FTC account's user id.
 * This is used to retrieve FTC account-only data.
 */
class FtcUser {
  /**
   * @param {string} id 
   */
  constructor(id) {
    this.userId = id;
  }

  /**
   * @returns {Promise<IProfile>}
   */
  async fetchProfile() {
    const resp = await request
      .get(nextApi.profile)
      .set(KEY_USER_ID, this.userId);

    return resp.body;
  }

  /**
   * @param {Object} data
   * @param {string} data.userName
   * @returns {Promise<void>}
   */
  updateDisplayName(data) {
    return request
      .patch(nextApi.name)
      .set(KEY_USER_ID, this.userId)
      .send(data);
  }

  /**
   * 
   * @param {Object} data 
   * @param {string} data.mobile
   * @return {Promise<void>}
   */
  updateMobile(data) {
    return request
      .patch(nextApi.mobile)
      .set(KEY_USER_ID, this.userId)
      .send(data);
  }

  /**
   * @param {Object} data 
   * @param {string} data.familyName
   * @param {string} data.givenName
   * @param {string} data.gender
   * @param {string} data.birthday
   * @returns {Promise<void>}
   */
  updatePersonalInfo(data) {
    return request
      .patch(nextApi.profile)
      .set(KEY_USER_ID, this.userId)
      .send(data);
  }

  /**
   * @param {Object} data
   * @param {string} data.email
   * @returns {Promise<void>}
   */
  updateEmail(data) {
    return request.patch(nextApi.email)
      .set(KEY_USER_ID, this.userId)
      .send(data);
  }

  /**
   * @param {Object} data 
   * @param {string} data.oldPassword
   * @param {string} data.newPassword
   * @returns {Promise<void>}
   */
  updatePassword(data) {
    return request.patch(nextApi.password)
      .set(KEY_USER_ID, this.userId)
      .send(data);
  }

  /**
   * @param {Object} clientApp 
   */
  requestVerificationLetter(clientApp) {
    return request
      .post(nextApi.requestVerification)
      .set(clientApp)
      .set(KEY_USER_ID, this.userId)
  }

  /**
   * @returns {Promise<IAddress>}
   */
  async fetchAddress() {
    const resp = await request
      .get(nextApi.address)
      .set(KEY_USER_ID, this.userId);

    return resp.body;
  }

  /**
   * @param {IAddress} address 
   */
  async updateAddress(address) {
    return request.patch(nextApi.address)
      .set(KEY_USER_ID, this.userId)
      .send(address);
  }
}


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

exports.FtcUser = FtcUser;
exports.Credentials = Credentials;
exports.ForgotPassword = ForgotPassword;
exports.Verification = Verification;
