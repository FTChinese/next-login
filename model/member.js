const {
  DateTime
} = require("luxon");
const debug = require("debug")("user:member");

class Membership {
  /**
   * @param {IMembership} member
   */
  constructor(member) {
    this.member = member;
    this._remains = null;
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
   * @returns {?number}
   */
  remainingDays() {
    if (!this.isMember()) {
      return null;
    }

    if (this._remains) {
      return this._remains;
    }

    const expireDt = DateTime.fromISO(this.member.expireDate)
    const today = DateTime.local().startOf("day");

    const diffInDays = expireDt.diff(today, "days");

    this._remains = diffInDays.toObject().days;
    return this._remains;
  }
}

module.exports = Membership;
