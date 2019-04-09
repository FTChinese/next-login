const request = require("superagent");
const debug = require("debug")("user:account");

const {
  nextApi,
  subsApi,
} = require("./endpoints");

const KEY_USER_ID = "X-User-Id";
const KEY_UNION_ID = "X-Union-Id";

/**
 * @description This is used for perform account related actions.
 * A user might login with email or with wechat,
 * thus the user have two identities.
 * You have to retrieve account data based on
 * how the user logged in: via email or wechat.
 * If user logged in via email, retrieve data from `/user/account`;
 * if user logged in via wechat, retrieve data from `/wx/account/`.
 * Always use the same endpoint once user is
 * logged in.
 * Mixing them might result unexpected behavior.
 */
class Account {
  /**
   * @param {IAccount} account 
   */
  constructor(account, client = null) {
    this._data = account;
    this._client = client;
  }

  /**
   * NOTE how curly braces, together with const,
   * are used to solve the terrible scoping issue.
   * @returns {Promise<IAccount>}
   */
  async fetchAccount() {
    switch (this._data.loginMethod) {
      case "email": {
        const resp = await request
            .get(nextApi.account)
            .set(KEY_USER_ID, this._data.id);

        /**
         * @type {IAccount}
         */
        return resp.body;
      };

      case "wechat": {
        const resp = await request
          .get(nextApi.wxAccount)
          .set(KEY_UNION_ID, this._data.unionId);

        /**
         * @type {IAccount}
         */
        return resp.body;
      };

      default:
        throw new Error("Unknown login method.");
    }
  }

  /**
   * @returns {Promise<IOrder[]>}
   */
  async fetchOrders() {
    const req = request.get(nextApi.orders);

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
    }

    const resp = await req;

    return resp.body;
  }

  /**
   * @param {string} tier 
   * @param {string} cycle 
   * @returns {Promise<IWxQRPay>}
   */
  async wxDesktopOrder(tier, cycle) {
    const req = request
      .post(subsApi.wxDesktopOrder(tier, cycle));

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
    }

    if (this._client) {
      req.set(this._client);
    }

    const resp = await req;

    return resp.body;
  }

  /**
   * @param {string} tier 
   * @param {string} cycle 
   * @returns {Promise<IWxMobilePay>}
   */
  async wxMobileOrder(tier, cycle) {
    const req = request
      .post(subsApi.wxMobileOrder(tier, cycle));

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
    }

    if (this._client) {
      req.set(this._client);
    }

    const resp = await req;

    return resp.body;
  }

  /**
   * 
   * @param {string} tier 
   * @param {string} cycle 
   * @returns {Promise<IAliWebPay>}
   */
  async aliDesktopOrder(tier, cycle) {
    const req = request
      .post(subsApi.aliDesktopOrder(tier, cycle));

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
    }

    if (this._client) {
      req.set(this._client);
    }

    const resp = await req;

    return resp.body;
  }

  /**
   * 
   * @param {string} tier - standard | premium
   * @param {string} cycle - year | month
   * @returns {Promise<IAliWebPay>}
   */
  async aliMobileOrder(tier, cycle) {
    const req = request
      .post(subsApi.aliMobileOrder(tier, cycle));

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
    }

    if (this._client) {
      req.set(this._client);
    }
    
    const resp = await req;

    return resp.body;
  }
}



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

  /**
   * @param {Object} paging
   * @param {number} paging.page
   * @param {number} paging.per_page
   */
  async starredArticles(paging) {
    const resp = await request
      .get(nextApi.starred)
      .query(paging)
      .set(KEY_USER_ID, this.userId);

    return resp.body;
  }

  unstarArticle(id) {
    return request
      .delete(`${nextApi.starred}/${id}`)
      .set(KEY_USER_ID, this.userId);
  }
}

/**
 * 
 * @param {Object} credentials 
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @param {Object} clientApp
 * @returns {Promise<IAccount>}
 */
async function emailLogin(credentials, clientApp) {
  const authResp = await request
    .post(nextApi.login)
    .set(clientApp)
    .send(credentials);

  /**
   * @type {{id: string}}
   */
  const user = authResp.body;
  const resp = await request
    .get(nextApi.account)
    .set(KEY_USER_ID, user.id);

  return resp.body;
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
exports.Account = Account;
exports.FtcUser = FtcUser;
exports.Credentials = Credentials;
exports.ForgotPassword = ForgotPassword;
exports.Verification = Verification;