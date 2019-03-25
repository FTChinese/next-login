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
const defaultPricing = require("./pricing-default.json");
/**
 * @type {IPromo}
 */
const promo = require("./promo.json");

/**
 * @param {IPromo} p 
 * @returns {boolean}
 */
function isPromoEffective(p) {
  const startAt = DateTime.fromISO(promo.startAt);
  const endAt = DateTime.fromISO(promo.endAt);

  debug("Start time: %s", startAt);
  debug("End time: %s", endAt)

  if (!startAt.isValid || !endAt.isValid) {
    return false;
  }

  const now = DateTime.local();

  debug("Now: %s", now);

  if (now >= startAt && now <= endAt) {
    debug("Using promo")
    return true;
  }

  return false;
}

/**
 * @returns {IPaywall}
 */
function getPaywall () {
  if (isPromoEffective(promo)) {
    return buildPaywall(promo.banner, promo.pricing);
  }

  debug("Using default paywall");
  return defaultPaywall;
}

/**
 * @param {IBanner} banner
 * @param {IPricing} pricing
 * @returns {IPaywall}
 */
function buildPaywall(baner, pricing) {
  return {
    banner,
    products: defaultPaywall.products.map(product => {
      const p = Object.assign({}, product);
      switch (product.tier) {
        case "standard":
          p.pricing = [
            pricing.standard_year, 
            pricing.standard_month
          ];
          break;
  
        case "premium":
          p.pricing = [
            pricing.premium_year
          ];
          break;
      }
  
      return p;
    })
  }
}

/**
 * @returns {IPricing}
 */
function getPricing() {
  if (isPromoEffective(promo)) {
    return promo.pricing;
  }

  return defaultPricing;
}

/**
 * @param {string} tier - standard | premium
 * @param {string} cycle - year | month
 * @returns {(IPlan|null)}
 */
function findPlan(tier, cycle) {
  const key = `${tier}_${cycle}`;

  const pricing = getPricing();

  if (pricing.hasOwnProperty(key)) {
    return pricing[key];
  }

  return null
}

exports.getPaywall = getPaywall;
exports.getCurrentPricing = getPricing;
exports.findPlan = findPlan;
