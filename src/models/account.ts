import {
  localizeTier,
  localizeCycle,
} from "./localization";
import {
  LoginMethod,
  Platform,
} from "./enums";
import { KEY_UNION_ID, KEY_USER_ID } from "../config/api";
import { ProfileFormData } from "./form-data";
import { URLs } from "../config/urls";
import { isMember, Membership } from "./membership";

export interface IAccountId {
  compoundId: string;
  ftcId?: string;
  unionId?: string;
}

interface IdHeaders {
  [KEY_UNION_ID]?: string;
  [KEY_USER_ID]?: string;
}

export class Wechat {
  nickname?: string;
  avatarUrl?: string;
}

export interface Account {
  id: string;
  unionId?: string;
  stripeId?: string;
  userName?: string;
  email: string;
  isVerified: boolean;
  avatarUrl?: string;
  loginMethod: LoginMethod;
  wechat: Wechat;
  membership: Membership;
}

export function accountVierified(account: Account): Account {
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

export function collectAccountIDs(a: Account): IdHeaders {
  const headers: IdHeaders = {};
  if (a.id) {
    headers[KEY_USER_ID] = a.id;
  }

  if (a.unionId) {
    headers[KEY_UNION_ID] = a.unionId;
  }

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

export function buildIdHeaders(account: Account): IdHeaders {
  const headers: IdHeaders = {};

  if (account.id) {
    headers[KEY_USER_ID] = account.id;
  }

  if (account.unionId) {
    headers[KEY_UNION_ID] = account.unionId;
  }

  return headers;
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
  userName?: string;
  mobile?: string;
  avatarUrl?: string;
  telephone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postcode?: string;
}

