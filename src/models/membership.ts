import { Tier, Cycle, PaymentMethod, SubStatus, OrderType } from "./enums";
import { DateTime } from "luxon";
import { Flash } from "../widget/flash";
import { localizeTier, membershipSource } from "./localization";
import { subsMap } from "../config/sitemap";

export interface Membership {
  id: string | null;
  tier: Tier | null;
  cycle: Cycle | null;
  expireDate: string | null;
  payMethod: PaymentMethod | null;
  autoRenew: boolean;
  status: SubStatus | null;
  vip: boolean;
}

export function isMember(m: Membership): boolean {
  return (!!m.tier) && (!!m.cycle) && (!!m.expireDate);
}

function isAliOrWxPay(m: PaymentMethod | null): boolean {
  return m === 'alipay' || m === 'wechat';
}

function urgeRenewMsg(remains?: number): string {

  if (remains === undefined) {
    return ""
  } else if (remains < 0) {
    return "会员已经过期，请续订。";
  } else if (remains === 0) {
    return '会员将于今天过期，请续订。'
  } else if (remains > 0 && remains <= 7) {
    return `会员即将过期，剩余${remains}天，请续订。`;
  }

  return "";
}

// Describes the UI to show membership.
export interface MemberStatus {
  reminder?: Flash;
  tier: string;
  expiration: string;
  autoRenew: boolean;
  sourceMsg?: string; // For Stripe, IAP, and B2B
  renewalLink?: string;
  upgradeLink?: string;
  ordersLink?: string;
}

export class MembershipParser {
  readonly expirationTime?: DateTime;
  readonly today = DateTime.local().startOf('day');
  readonly maxRenewalTime = this.today.plus({ year: 3 });
  readonly isMember: boolean;
  readonly isAliOrWxPay: boolean;

  constructor(
    readonly member: Membership,
  ) {
    if (member.expireDate) {
      this.expirationTime = DateTime.fromISO(member.expireDate)
    }

    this.isAliOrWxPay = isAliOrWxPay(member.payMethod);
    this.isMember = isMember(member);
  }

  // Zero membership is treated as expired.
  get expired(): boolean {
    if (!this.expirationTime) {
      return true;
    }

    return this.expirationTime < this.today;
  }

  get renewOffExpired(): boolean {
    return this.expired && !this.member.autoRenew;
  }

  get canRenewViaAliWx(): boolean {
    if (!this.expirationTime) {
      return false;
    }

    return (this.expirationTime <= this.today.plus({ year: 3 })) && (this.expirationTime >= this.today)
  }

  get remainingDays(): number | undefined {
    if (!this.expirationTime) {
      return undefined;
    }

    return this.expirationTime
      .diff(this.today, 'days')
      .toObject()
      .days;
  }

  get statusUI(): MemberStatus | undefined {

    if (!this.isMember) {
      return undefined;
    }
  
    const renewable = this.isAliOrWxPay && this.canRenewViaAliWx;

    const upgradable = renewable && (this.member.tier == 'standard');

    const nagMsg = urgeRenewMsg(this.remainingDays);
  
    return {
      reminder: nagMsg 
        ? Flash.danger(nagMsg).setDismissible(false) 
        : undefined,
      tier: localizeTier(this.member.tier),
      expiration: this.member.vip 
        ? '无限期' 
        : (this.member.expireDate || ''),
      renewalLink: renewable 
        ? subsMap.checkoutUrl(this.member.tier!, this.member.cycle!) 
        : undefined,
      upgradeLink: upgradable
        ? subsMap.checkoutUrl("premium", "year")
        : undefined,
      sourceMsg: this.member.payMethod
        ? membershipSource[this.member.payMethod]
        : undefined,
      autoRenew: this.member.autoRenew,
      ordersLink: subsMap.orders,
    };
  }
}

export function isMemberExpired(m: Membership): boolean {
  if (!m.expireDate) {
    return true;
  }

  const expireOn = DateTime.fromISO(m.expireDate);
  const today = DateTime.local().startOf("day");

  return expireOn < today;
}

