const {
  DateTime
} = require("luxon");
const debug = require("debug")("user:member");
const localized = require("../model/localized");

class Membership {
  /**
   * @param {IMembership} member
   */
  constructor(member) {
    this._member = member;
    this._remains = null;
  }

  get tier() {
    return this._member.tier;
  }

  get cycle() {
    return this._member.cycle;
  }

  get expireDate() {
    return this._member.expireDate;
  }

  buildMemberType() {
    if (!this._member.tier || !this._member.cycle) {
      return localized.zeroMember;
    }

    return `${localized[this._member.tier]}/${localized[this._member.cycle]}`;
  }

  /**
   * Test if the user is a subscribed member.
   * @returns {boolean}
   */
  isMember() {
    debug("%O", this._member);

    return this._member.tier 
      && this._member.cycle 
      && this._member.expireDate;
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

    const expireDt = DateTime.fromISO(this._member.expireDate)
    const today = DateTime.local().startOf("day");

    const diffInDays = expireDt.diff(today, "days");

    this._remains = diffInDays.toObject().days;
    return this._remains;
  }

  /**
   * @returns {boolean}
   */
  isExpired() {
    if (!this.remainingDays()) {
      return true;
    }

    if (this.remainingDays() > 0) {
      return false;
    }

    return true;
  }
}

module.exports = Membership;
