import { Tier, Cycle, PaymentMethod, SubStatus, OrderType, Edition } from "./enums";
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

interface CheckoutIntent {
  orderKind?: OrderType;
  warning: string;
  payMethods: PaymentMethod[];
}

/**
 * MembershipParse converts Membership object into class.
 */
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

  get autoRenewOffExpired(): boolean {
    return this.expired && !this.member.autoRenew;
  }

  get withinAliWxRenewalPeriod(): boolean {
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
  
    const renewable = this.isAliOrWxPay && this.withinAliWxRenewalPeriod;

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

  checkoutIntent(edition: Edition): CheckoutIntent {
    if (this.autoRenewOffExpired) {
      return {
        orderKind: 'create',
        payMethods: ['alipay', 'wechat', 'stripe'],
        warning: ''
      };
    }

    if (this.member.payMethod === 'b2b') {
      return {
        orderKind: 'add_on',
        payMethods: ['alipay', 'wechat'],
        warning: '企业版订阅请阅读下方注意事项',
      }
    }

    // Renewal
    if (this.member.tier === edition.tier) {
      // Depending on how current membership is purchased.
      switch (this.member.payMethod) {
        // For ali and wx, should continue to use them.
        case 'alipay':
        case 'wechat':
          if (!this.withinAliWxRenewalPeriod) {
            return {
              orderKind: 'renew',
              payMethods: [],
              warning: '剩余时间超出允许的最长续订期限',
            };
          }
          return {
            orderKind: 'renew',
            payMethods: ['alipay', 'wechat', 'stripe'], // If using stripe, move remaining days to add-on.
            warning: '选择Stripe支付请阅读下方注意事项'
          };

        case 'stripe':
        case 'apple':
          return {
            orderKind: 'add_on',
            payMethods: ['alipay', 'wechat'],
            warning: 'Stripe/苹果内购会员请阅读下方注意事项'
          }
      }
    }

    // Upgrade
    if (edition.tier === 'premium') {
      switch (this.member.payMethod) {
        case 'alipay':
        case 'wechat':
          return {
            orderKind: 'upgrade',
            payMethods: ['alipay', 'wechat', 'stripe'],
            warning: '升级高端会员将即可启用，标准版的剩余时间将在高端版失效后继续使用'
          };

        case 'stripe':
          return {
            orderKind: 'upgrade',
            payMethods: ['stripe'],
            warning: 'Stripe订阅升级高端版会自动调整您的扣款额度'
          }
        case 'apple':
          return {
            payMethods: [],
            warning: '苹果内购的订阅升级高端版需要在您的苹果设备上，使用您的原有苹果账号登录后，在FT中文网APP内操作'
          }
      }
    }

    return {
      payMethods: [],
      warning: '仅支持新建订阅、续订和标准版升级高端版，不支持其他操作。'
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

