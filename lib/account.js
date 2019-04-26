const request = require("superagent");
const debug = require("debug")("user:account");
const Membership = require("./member");

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
    this._member = null;
  }

  /**
   * @return {string}
   */
  get id() {
    return this._data.id;
  }

  /**
   * @return {string|null}
   */
  get unionId() {
    return this._data.unionId;
  }

  /**
   * @return {string|null}
   */
  get userName() {
    return this._data.unionId;
  }

  /**
   * @return {string}
   */
  get email() {
    return this._data.email;
  }

  /**
   * @return {boolean}
   */
  get isVerified() {
    return this._data.isVerified;
  }

  /**
   * @return {string|null}
   */
  get avatar() {
    return this._data.avatar;
  }

  /**
   * @return {boolean}
   */
  get isVip() {
    return this._data.isVip;
  }

  /**
   * @return {"email"|"wechat"}
   */
  get loginMethod() {
    return this._data.loginMethod;
  }

  /**
   * @return {IWechat}
   */
  get wechat() {
    return this._data.wechat;
  }

  /**
   * @return {Membership}
   */
  get member() {
    if (!this._member) {
      this._member = new Membership(this._data.membership);
    }
    return this._member;
  }

  isMember() {
    return this.member.isMember();
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

  /**
   * @description Test if two `Account`s are the the same one.
   * @param {Account} other 
   * @returns {boolean}
   */
  isEqual(other) {
    return this.id === other.id;
  }

  /**
   * @description Test if FTC account is bound to wechat account
   * @return {boolean}
   */
  isCoupled() {
    return !!(this._data.id && this._data.unionId);
  }

  /**
   * @description Test if this is a wechat-only account
   * @return {boolean}
   */
  isWxOnly() {
    return (this._data.unionId) && (!this._data.id);
  }

  /**
   * @description Test if this is an FTC-only account
   * @return {boolean}
   */
  isFtcOnly() {
    return (this._data.id) && (!this._data.unionId);
  }

  setClientApp(app) {
    this._client = app;
  }

  /**
   * @description Refresh current user account.
   * NOTE how curly braces, together with const,
   * are used to solve the terrible scoping issue.
   * @returns {Promise<IAccount>}
   */
  async fetch() {
    switch (this.loginMethod) {
      case "email": {
        const resp = await request
            .get(nextApi.account)
            .set(KEY_USER_ID, this.id);

        /**
         * @type {IAccount}
         */
        return resp.body;
      };

      case "wechat": {
        const resp = await request
          .get(nextApi.wxAccount)
          .set(KEY_UNION_ID, this.unionId);

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
   * @description Get user's another account that will be bound to this one.
   * @param {string} targetId
   * @return {Promise<{ftcAccount: Account, wxAccount: Account}>}
   */
  async fetchBinding(targetId) {
    switch (this.loginMethod) {
      case "email": {
        const resp = await request
          .get(nextApi.wxAccount)
          .set(KEY_UNION_ID, targetId);

        const acntData = resp.body;

        return {
          ftcAccount: this,
          wxAccount: new Account(acntData),
        };
      }

      case "wechat": {
        const resp = await request
          .get(nextApi.account)
          .set(KEY_USER_ID, targetId);

        const acntData = resp.body;

        return {
          ftcAccount: new Account(acntData),
          wxAccount: this,
        };
      }

      default:
        throw new Error("Unknow login method.");
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

  /**
   * @description Merging two existing accounts.
   * @param {string} targetId - The id to  be merged into current account. This is the FTC id if current acout is wechat, or wechat union id if current account is FTC.
   * @return {Promise<boolean>}
   */
  async merge(targetId) {
    const req = request.put(nextApi.wxMerge)

    switch (this.loginMethod) {
      case "email":
        req.set(KEY_UNION_ID, targetId)
          .send({
            userId: this.id,
          });
        break;

      case "wechat":
          req.set(KEY_UNION_ID, this.unionId)
            .send({
              userId: targetId,
            });
        break;

      default:
        throw new Error("Unknow login method");
    }

    const resp = await req;

    return resp.noContent;
  }
}

module.exports = Account;
