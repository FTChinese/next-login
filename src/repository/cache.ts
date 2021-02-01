import NodeCache from 'node-cache';
import { Paywall, Plan } from '../models/paywall';
import { Edition } from '../models/enums';
import { Price, StripeEdition } from '../models/stripe';

const cache = new NodeCache({
  stdTTL: 7200,
});

// Used as the key to cache paywall.
const KEY_PAYWALL_CACHE = 'paywall';

function getEditionKey(e: Edition): string {
  return `${e.tier}_${e.cycle}`;
}

function getStripeEditionKey(e: StripeEdition): string {
  let prefix: string
  if (e.live) {
    prefix = 'live'
  } else {
    prefix = 'test'
  }

  return `${prefix}_${getEditionKey(e)}`;
}

function getModeStr(live: boolean): string {
  if (live) {
    return 'live'
  }

  return 'test'
}
class PaywallCache {

  savePaywall(p: Paywall) {
    // Clear data before saving paywall data.
    cache.flushAll();

    cache.set(KEY_PAYWALL_CACHE, p);

    p.products.forEach(prod => {
      prod.plans.forEach(plan => {
        cache.set(`${plan.tier}_${plan.cycle}`, plan);
      });
    });
  }

  // Cache plan with key set to <tier>_<cycle>:
  // `standard_year`
  // `standard_month`
  // `premium_year`
  saveFtcPlans(plans: Plan[]) {
    plans.forEach(plan => {
      cache.set(`ftc_${getEditionKey(plan)}`, plan);
    });
  }

  getPaywall(): Paywall | undefined {
    return cache.get<Paywall>(KEY_PAYWALL_CACHE);
  }

  getFtcPlan(edition: Edition): Plan | undefined {
    return cache.get<Plan>(`ftc_${getEditionKey(edition)}`);
  }

  saveStripePrices(prices: Price[]) {
    prices.forEach(price => {
      if (price.active) {
        cache.set(`stripe_${getStripeEditionKey(price)}`, price);
      }
    });
  }

  getStripePrice(edition: StripeEdition): Price | undefined {
    return cache.get<Price>(`stripe_${getStripeEditionKey(edition)}`);
  }

  clear() {
    cache.flushAll()
  }

  inspect(): string[] {
    return cache.keys();
  }
}

export const paywallCache = new PaywallCache();
