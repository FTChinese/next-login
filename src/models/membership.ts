import { Tier, Cycle, PaymentMethod, SubStatus } from "./enums";
import { DateTime } from "luxon";
import { Flash } from "../widget/flash";
import { localizeTier } from "./localization";
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

export function isMemberExpired(m: Membership): boolean {
  if (!m.expireDate) {
    return true;
  }

  const expireOn = DateTime.fromISO(m.expireDate);
  const today = DateTime.local().startOf("day");

  return expireOn < today;
}

interface MemberStatus {
  isMember: boolean;
  expirationTime?: DateTime;
  remainingDays?: number;
  expired: boolean;
  renewable: boolean;
  upgradable: boolean;
}

function getMemberStatus(m: Membership): MemberStatus{
  if (!isMember(m)) {
    return {
      isMember: false,
      expirationTime: undefined,
      remainingDays: undefined,
      expired: true,
      renewable: false,
      upgradable: false,
    };
  }

  const expiration = DateTime.fromISO(m.expireDate!!);
  const today = DateTime.local().startOf('day');

  const diffInDays = expiration.diff(today, 'days');

  const remaining = diffInDays.toObject().days;

  return {
    isMember: true,
    expirationTime: expiration,
    remainingDays: remaining,
    expired: expiration < today,
    renewable: expiration <= today.plus({ year: 3 }) && expiration >= today,
    upgradable: m.tier == 'standard'
  }
}

function urgeRenewMsg(remains?: number): string {
  if (!remains) {
    return ""
  } else if (remains < 0) {
    return "会员已经过期，请续订";
  } else if (remains > 0 && remains <= 7) {
    return `会员即将过期，剩余${remains}天，请续订`;
  }

  return "";
}

export interface MemberStatusUI {
  reminder?: Flash;
  tier: string;
  expiration: string;
  renewalLink?: string;
  upgradeLink?: string;
  ordersLink?: string;
}

export function newMemberStatusUI(m: Membership): MemberStatusUI | undefined {

  const status = getMemberStatus(m);

  if (!status.isMember) {
    return undefined;
  }

  const nagMsg = urgeRenewMsg(status.remainingDays);

  return {
    reminder: nagMsg 
      ? Flash.danger(nagMsg).setDismissible(false) 
      : undefined,
    tier: localizeTier(m.tier),
    expiration: m.vip 
      ? '无限期' 
      : (m.expireDate || ''),
    renewalLink: status.renewable 
      ? subsMap.checkoutUrl(m.tier!, m.cycle!) 
      : undefined,
    upgradeLink: status.upgradable
      ? subsMap.checkoutUrl('premium', 'year')
      : undefined,
    ordersLink: subsMap.orders,
  };
}
