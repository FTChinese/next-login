const request = require("superagent");
const debug = require("debug")("user:account");
const {
  DateTime
} = require("luxon");

const {
  KEY_USER_ID,
  KEY_UNION_ID,
} = require("../lib/request");
const {
  nextApi
} = require("./endpoints");
const localized = require("./localized");

class Account {
  /**
   * @param {IAccount} account 
   */
  constructor(account) {
    this.data = account;
    this.member = new Membership(account.membership);
  }

  get isVip() {
    return this.data.isVip;
  }

  get isMember() {
    return this.member.isMember;
  }

  get accountData() {
    return this.data;
  }

  /**
   * NOTE how curly braces, together with const,
   * are used to solve the terrible scoping issue.
   * @returns {Promise<IAccount>}
   */
  async fetchAccount() {
    switch (this.data.loginMethod) {
      case "email": {
        const resp = await request
            .get(nextApi.account)
            .set(KEY_USER_ID, this.data.id);

        /**
         * @type {IAccount}
         */
        const acnt = resp.body;
        this.data = acnt;
        this.member = new Membership(acnt.membership);

        return acnt;
      };

      case "wechat": {
        const resp = await request
          .get(nextApi.wxAccount)
          .set(KEY_UNION_ID, this.data.unionId);

        /**
         * @type {IAccount}
         */
        const acnt = resp.body;
        this.data = acnt;
        this.member = new Membership(account.membership);

        return acnt;
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

    if (this.data.id) {
      req.set(KEY_USER_ID, this.data.id);
    }

    if (this.data.unionId) {
      req.set(KEY_UNION_ID, this.data.unionId);
    }

    const resp = await req;

    return resp.body;
  }
}

class Membership {
  /**
   * @param {IMembership} member
   */
  constructor(member) {
    this.member = member;
  }

  /**
   * Test if the user is a subscribed member.
   * @returns {boolean}
   */
  get isMember() {
    debug("%O", this.member);

    return this.member.tier 
      && this.member.cycle 
      && this.member.expireDate;
  }

  /**
   * Test if a membership is expired.
   * @returns {boolean}
   */
  get isExpired() {
    const expTime = DateTime.fromISO(member.expireDate, {
      zone: "utc"
    });
    return expTime < DateTime.utc();
  }

  get localizeTierCycle() {
    return `${localized[this.member.tier]}/${localized[this.member.cycle]}`
  }

  get expireDate() {
    return this.member.expireDate;
  }
}

class FtcUser {
  constructor(id) {
    this.userId = id;
  }

  /**
   * @returns {Promise<IAddress>}
   */
  async fetchAddress() {
    const resp = await request.get(nextApi.address)
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

exports.Account = Account;
exports.Membership = Membership;
exports.FtcUser = FtcUser;
