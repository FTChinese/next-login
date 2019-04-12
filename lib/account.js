const request = require("superagent");
const debug = require("debug")("user:account");

const {
  nextApi,
  subsApi,
} = require("./endpoints");
const {
  KEY_USER_ID,
  KEY_UNION_ID,
} = require("./request");

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

  get id() {
    return this._data.id;
  }

  get unionId() {
    return this._data.unionId;
  }

  get userName() {
    return this._data.unionId;
  }

  get email() {
    return this._data.email;
  }

  get isVerified() {
    return this._data.isVerified;
  }

  get avatar() {
    return this._data.avatar;
  }

  get isVip() {
    return this._data.isVip;
  }

  get loginMethod() {
    return this._data.loginMethod;
  }

  get wechat() {
    return this._data.wechat;
  }

  get membership() {
    return this._data.membership;
  }

  getDisplayName() {
    if (this._data.userName) {
      return this._data.userName;
    }

    if (this._data.wechat.nickname) {
      return this._data.wechat.nickname
    }

    if (this._data.email) {
      return this._data.email.split("@")[0];
    }

    return "";
  }

  isCoupled() {
    return !!(this._data.id && this._data.unionId);
  }

  isWxOnly() {
    return (this._data.unionId) && (!this._data.id);
  }

  isFtcOnly() {
    return (this._data.id) && (!this._data.unionId);
  }

  setClientApp(app) {
    this._client = app;
  }

  /**
   * NOTE how curly braces, together with const,
   * are used to solve the terrible scoping issue.
   * @returns {Promise<IAccount>}
   */
  async refreshAccount() {
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
      req.set(headerKeys.USER_ID, this._data.id);
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

  /**
   * @param {Object} paging
   * @param {number} paging.page
   * @param {number} paging.per_page
   * @returns {Promise<void>}
   */
  async starredArticles(paging) {
    const req = request
      .get(nextApi.starred)
      .query(paging);

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
   * @param {string} articleId 
   * @returns {Promise<void>}
   */
  unstarArticle(articleId) {
    const req = request
      .delete(`${nextApi.starred}/${articleId}`);

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
    }

    return req;
  }
}

module.exports = Account;
