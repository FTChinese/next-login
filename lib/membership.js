const moment = require("moment");
const { parseDateTime } = require("./date-time");

const localized = {
  "year": "年",
  "month": "月",
  "CNY": "¥",
  "standard": "标准会员",
  "premium": "高端会员"
}

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
    this.expireDate = member.expireDate;
  }

  isExpired() {
    const expireTime = parseDateTime(this.expireDate);

    return expireTime.isBefore(moment());
  }

  /**
   * expireDate - today < billingCycle
   */
  canRenew() {
    const expireTime = parseDateTime(this.expireDate);

    const afterACycle = dateAfterACycle(this.billingCycle);

    return expireTime.isBefore(afterACycle);
  }

  localize() {
    return {
      tier: this.tier,
      cycle: this.cycle,
      expireDate: this.expireDate,
      isExpired: this.isExpired(),
      canRenew: this.canRenew(),
    };
  }
}

function dateAfterACycle(cycle) {
  const today = moment();

  switch (cycle) {
    case "month":
      return today.add("1", "months");

    case "year":
      return today.add("1", "years");

    default:
      return today;
  }
}

exports.Membership = Membership;
exports.localized = localized;