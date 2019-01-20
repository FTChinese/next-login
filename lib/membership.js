const moment = require("moment");
const { DateTime } = require("luxon");

const localized = {
  "year": "年",
  "month": "月",
  "CNY": "¥",
  "standard": "标准会员",
  "premium": "高端会员",
  "tenpay": "微信支付",
  "alipay": "支付宝",
};

class Membership {
  /**
   * @param {Object} member
   * @param {string} member.tier
   * @param {string} member.billingCycle
   * @param {string} member.expireDate
   */
  constructor(member) {
    this.tier = member.tier;
    this.cycle = member.billingCycle;
    this.expireDate = member.expireDate
    this.expTime = DateTime.fromISO(member.expireDate, {zone: "utc"});
    this.now = DateTime.utc();
  }

  /**
   * Test if a membership object is a subscribed member.
   * @returns {boolean}
   */
  isMember() {
    return this.tier && this.cycle && this.expireDate;
  }

  // 
  /**
   * Test if a membership is expired.
   * @returns {boolean}
   */
  isExpired() {
    return this.expTime < this.now;
  }

  /**
   * Test if membership is within allowed renewal period.
   * expireDate - today < billingCycle.
   * @returns {boolean}
   */
  canRenew() {

    const afterACycle = this.dateAfterACycle();

    return this.expTime < afterACycle;
  }

  /**
   * Caculate the date after of today after a cycle.
   * @returns {moment.Moment}
   */
  dateAfterACycle() {
    switch (this.cycle) {
      case "month":
        return this.now.plus({months: 1});
  
      case "year":
        return this.now.plus({years: 1});
  
      default:
        return this.now;
    }    
  }

  /**
   * Returns a clone the the original membership object with
   * some caculated fields so that template could should if a user if allowed to renew subscription.
   */
  normalize() {
    if (!this.isMember()) {
      return null;
    }
    return {
      tier: this.tier,
      cycle: this.cycle,
      expireDate: this.expireDate,
      isExpired: this.isExpired(),
      canRenew: this.canRenew(),
    };
  }
}

exports.Membership = Membership;
exports.localized = localized;