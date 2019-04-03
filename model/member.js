const {
  DateTime
} = require("luxon");

class Membership {
  /**
   * @param {IMembership} member
   */
  constructor(member) {
    this.member = member;
  }

  get tier() {
    return this.member.tier;
  }

  get cycle() {
    return this.member.cycle;
  }

  get expireDate() {
    return this.member.expireDate;
  }

  /**
   * Test if the user is a subscribed member.
   * @returns {boolean}
   */
  isMember() {
    debug("%O", this.member);

    return this.member.tier 
      && this.member.cycle 
      && this.member.expireDate;
  }

  /**
   * Test if a membership is expired.
   * @returns {boolean}
   */
  isExpired() {
    const expTime = DateTime.fromISO(member.expireDate, {
      zone: "utc"
    });
    return expTime < DateTime.utc();
  }


}

module.exports = Membership;
