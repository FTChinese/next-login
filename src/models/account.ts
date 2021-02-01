import {
  localizeTier,
  localizeCycle,
} from "./localization";
import {
  LoginMethod,
  Platform,
} from "./enums";
import { ProfileFormData } from "./form-data";
import { URLs } from "../config/urls";
import { isMember, Membership } from "./membership";
import { HeaderReaderId, KEY_USER_ID, KEY_UNION_ID } from "./header";

export interface IAccountId {
  compoundId: string;
  ftcId?: string;
  unionId?: string;
}

export class Wechat {
  nickname?: string;
  avatarUrl?: string;
}

export interface Account {
  id: string;
  unionId: string | null;
  stripeId: string | null;
  userName: string | null;
  email: string;
  isVerified: boolean;
  avatarUrl: string | null;
  loginMethod: LoginMethod;
  wechat: Wechat;
  membership: Membership;
}

export function isTestAccount(a: Account): boolean {
  return a.email.endsWith('.test@ftchinese.com');
}

export function accountVerified(account: Account): Account {
  account.isVerified = true;
  return account;
}

export function getReaderName(account: Account): string {
  if (account.userName) {
    return account.userName;
  }

  if (account.wechat.nickname) {
    return account.wechat.nickname;
  }

  if (account.email) {
    return account.email.split("@")[0];
  }

  return "";
}

export function isAccountWxOnly(a: Account): boolean {
  return (!a.id) && (!!a.unionId);
}

export function isAccountFtcOnly(a: Account): boolean {
  return (!!a.id) && (!a.unionId);
}

export function isAccountLinked(a: Account): boolean {
  return !!(a.id && a.unionId);
}

export function isAccountEqual(a: Account, b: Account): boolean {
  return a.id === b.id;
}

export function collectAccountIDs(a: Account): HeaderReaderId {
  const headers: HeaderReaderId = {};
  if (a.id) {
    headers[KEY_USER_ID] = a.id;
  }

  if (a.unionId) {
    headers[KEY_UNION_ID] = a.unionId;
  }

  return headers;
}

export function collectFtcID(a: Account): HeaderReaderId {
  const headers: HeaderReaderId = {};
  headers[KEY_USER_ID] = a.id;
  return headers;
}

export function customerServiceEmail(account: Account): string {

  if (!isMember(account.membership)) {
    return URLs.subsService;
  }
  const mailTo = new URL(URLs.subsService);

  const params = new URLSearchParams();

  if (account.email) {
    params.set("from", account.email);
  }

  if (isMember(account.membership)) {
    params.set("subject", `${localizeTier(account.membership.tier!!)}/${localizeCycle(account.membership.cycle!!)}_${account.membership.expireDate}`);
  }

  mailTo.search = params.toString();

  return mailTo.href;
}



export interface IClientApp {
  clientType: Platform;
  clientVersion: string;
  userIp: string;
  userAgent: string;
}

export interface Profile extends ProfileFormData {
  id: string;
  email: string;
  userName: string | null;
  mobile: string | null;
  avatarUrl: string | null;
  telephone: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  address: Address;
}

export interface Address {
  country: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  street: string | null;
  postcode: string | null;
}

