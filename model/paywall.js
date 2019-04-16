const {
  DateTime,
} = require("luxon");
const debug = require("debug")("user:paywall");

/**
 * @type {IPaywall}
 */
const defaultPaywall = require("./paywall-default.json");
/**
 * @type {IPricing}
 */
const pricing = require("./pricing.json");
/**
 * @type {IPromo}
 */
const promo = require("./promo.json");

class Promo {
  /**
   * @param {IPromo} promo
   */
  constructor (promo) {
    this._promo = promo;
    this.startAt = DateTime.fromISO(promo.startAt);
    this.endAt = DateTime.fromISO(promo.endAt);
  }

  get banner() {
    return this._promo.banner;
  }

  get pricing() {
    return this._promo.pricing;
  }

  /**
   * @description Check whether the promotion plan is in valid time range.
   * @returns {boolean}
   */
  isInEffect() {

    if (!this.startAt.isValid || !this.endAt.isValid) {
      return false;
    }

    const now = DateTime.utc();

    debug("Now: %s", now.toString());

    if (this.startAt <= now && this.endAt >= now) {
      debug("Using promo")
      return true;
    }

    return false;
  }
}

class Paywall {
  constructor() {
    this._defaultPaywall = defaultPaywall;
    this._defaultPricing = pricing;
    this._promo = new Promo(promo);
  }

  /**
   * @param {IPromo} p
   */
  setPromo(p) {
    this._promo = new Promo(p);
  }

  /**
   * @description Get paywall data. Returns the default paywall if no promotion is available, or build a paywall from promotion.
   * @returns {IPaywall}
   */
  getPaywall () {
    if (this._promo.isInEffect()) {
      return this.buildPromoPaywall();
    }

    debug("Using default paywall");
    return this._defaultPaywall;
  }

  /**
   * @returns {IPricing}
   */
  getPricing() {
    if (this._promo.isInEffect()) {
      return this._promo.pricing;
    }

    return this._defaultPricing;
  }

  /**
   * @param {string} tier - standard | premium
   * @param {string} cycle - year | cycle
   * @returns {(IPlan|null)}
   */
  findPlan(tier, cycle) {
    const key = `${tier}_${cycle}`;

    const pricing = this.getPricing();

    const plan = pricing[key];

    return plan ? plan : null;
  }

  /**
   * @private
   * @returns {IPaywall}
   */
  buildPromoPaywall() {
    const promoPricing = this._promo.pricing;
    const banner = this._promo.banner;

    return {
      banner,
      products: this._defaultPaywall.products.map(product => {
        const p = Object.assign({}, product);
        switch (product.tier) {
          case "standard":
            p.pricing = [
              promoPricing.standard_year,
              promoPricing.standard_month
            ];
            break;

          case "premium":
            p.pricing = [
              promoPricing.premium_year
            ];
            break;
        }

        return p;
      }),
    }
  }
}

exports.Promo = Promo;
exports.Paywall = Paywall;
exports.paywall = new Paywall();
