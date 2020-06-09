import {
  jsonObject,
  jsonMember,
  TypedJSON,
} from "typedjson";
import {
  DateTime,
} from "luxon";
import {
  localizeTier,
  localizeCycle,
} from "./localization";
import {
  accountMap,
  subsMap,
} from "../config/sitemap";
import {
  LoginMethod,
  PaymentMethod,
  Tier,
  Cycle,
  Platform,
  SubStatus,
} from "./enums";
import { KEY_UNION_ID, KEY_USER_ID } from "../config/api";
import { ProfileFormData } from "./form-data";



@jsonObject
export class Wechat {
  @jsonMember
  nickname?: string;

  @jsonMember
  avatarUrl?: string;
}

@jsonObject
export class Membership {
  @jsonMember
  id: string | null;

  @jsonMember
  tier: Tier | null;

  @jsonMember
  cycle: Cycle | null;

  @jsonMember
  expireDate: string | null;

  @jsonMember
  payMethod: PaymentMethod | null;

  @jsonMember
  autoRenew: boolean;

  @jsonMember
  status: SubStatus | null;

  @jsonMember
  vip: boolean;

  get tierCN(): string {
    if (!this.tier) {
      return "尚未成为会员";
    }

    return localizeTier(this.tier);
  }

  get cycleCN(): string {
    if (!this.cycle) {
      return ""
    }

    return localizeCycle(this.cycle);
  }

  get isMember(): boolean {
    if (this.vip) {
      return true;
    }

    return (!!this.tier) && (!!this.cycle) && (!!this.expireDate);
  }

  get remainingDays(): number | null {

    if (!this.expireDate) {
      return null;
    }

    const expireOn = DateTime.fromISO(this.expireDate);
    const today = DateTime.local().startOf("day");

    const diffInDays = expireOn.diff(today, "days");

    return diffInDays.toObject().days || null;
  }

  get isExpired(): boolean {
    const remains = this.remainingDays;

    if (!remains) {
      return true;
    }

    if (remains > 0) {
      return false;
    }

    return true;
  }

  get renewalUrl(): string | null {
    if (!this.tier || !this.cycle) {
      return null;
    }

    return `${subsMap.pay}/${this.tier}/${this.cycle}`;
  }

  get expireSeconds(): number {
    if (!this.expireDate) {
      return 0;
    }

    return DateTime.fromISO(this.expireDate).toSeconds();
  }
}

export interface IAccountId {
  compoundId: string;
  ftcId?: string;
  unionId?: string;
}

interface IdHeaders {
  [KEY_UNION_ID]?: string;
  [KEY_USER_ID]?: string;
}

@jsonObject
export class Account {
  @jsonMember
  id: string;

  @jsonMember
  unionId?: string;

  @jsonMember
  stripeId?: string;

  @jsonMember
  userName?: string;

  @jsonMember
  email: string;

  @jsonMember
  isVerified: boolean;

  @jsonMember
  avatarUrl?: string;

  @jsonMember
  loginMethod: LoginMethod;

  @jsonMember
  wechat: Wechat;

  @jsonMember
  membership: Membership;

  withVerified(): Account {
    this.isVerified = true;
    return this;
  }

  getDisplayName(): string {
    if (this.userName) {
      return this.userName;
    }

    if (this.wechat.nickname) {
      return this.wechat.nickname;
    }

    if (this.email) {
      return this.email.split("@")[0];
    }

    return "";
  }

  isWxOnly(): boolean {
    return (!this.id) && (!!this.unionId)
  }

  isFtcOnly(): boolean {
    return (!!this.id) && (!this.unionId)
  }

  isLinked(): boolean {
    return !!(this.id && this.unionId);
  }

  get linkFtc(): string {
    return accountMap.linkEmail;
  }

  isEqual(other: Account): boolean {
    return this.id === other.id;
  }

  get customerServiceMail(): string {
    const mailTo = new URL("mailto:subscriber.service@ftchinese.com");

    const params = new URLSearchParams();

    if (this.email) {
      params.set("from", this.email);
    }

    if (this.membership.isMember) {
      params.set("subject", `${this.membership.tierCN}/${this.membership.cycleCN}_${this.membership.expireDate}`);
    }

    mailTo.search = params.toString();

    return mailTo.href;
  }

  get idHeaders(): IdHeaders {
    const headers: IdHeaders = {};
    if (this.id) {
      headers[KEY_USER_ID] = this.id;
    }

    if (this.unionId) {
      headers[KEY_UNION_ID] = this.unionId;
    }

    return headers;
  }
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

export const accountSerializer = new TypedJSON(Account);

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

