import NodeCache from 'node-cache';
import { Paywall, Plan } from '../models/paywall';
import { Edition } from '../models/enums';

const cache = new NodeCache({
  stdTTL: 7200,
});

const KEY_PAYWALL_CACHE = 'paywall';

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

  savePlans(plans: Plan[]) {
    plans.forEach(plan => {
      cache.set(`${plan.tier}_${plan.cycle}`, plan);
    });
  }

  getPaywall(): Paywall | undefined {
    return cache.get<Paywall>(KEY_PAYWALL_CACHE);
  }

  getPlan(edition: Edition): Plan | undefined {
    return cache.get<Plan>(`${edition.tier}_${edition.cycle}`);
  }

  clear() {
    cache.flushAll()
  }

  inspect(): string[] {
    return cache.keys();
  }
}

export const paywallCache = new PaywallCache();
