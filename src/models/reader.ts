import {
    jsonObject,
    jsonMember,
    TypedJSON,
} from "typedjson";
import { 
    DateTime,
} from "luxon";
import {
    localizeGender,
    localizeTier,
    localizeCycle,
} from "./localization";
import {
    profileMap,
    accountMap,
    entranceMap,
    subsMap,
} from "../config/sitemap";
import {
    LoginMethod,
    PaymentMethod,
    Tier,
    Cycle,
    Gender,
    Platform,
    SubStatus,
} from "./enums";
import { KEY_UNION_ID, KEY_USER_ID } from "../config/api";

export interface ICredentials {
    email: string;
    password: string;
}

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
    id?: string;

    @jsonMember
    tier?: Tier;

    @jsonMember
    cycle?: Cycle;

    @jsonMember
    expireDate?: string;

    @jsonMember
    payMethod?: PaymentMethod;

    @jsonMember
    autoRenew?: boolean;

    @jsonMember
    status?: SubStatus;

    @jsonMember
    vip?: boolean;

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

    nagVerifyEmail(): boolean {
        return this.isFtcOnly() && (!this.isVerified);
    }

    get requestVerificationLink(): string {
        return accountMap.requestVerification;
    }

    get settingsLink(): string {
        return profileMap.base;
    }

    get logoutLink(): string {
        return entranceMap.logout;
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

export const accountSerializer = new TypedJSON(Account);

export interface IClientApp {
    clientType: Platform;
    clientVersion: string;
    userIp: string;
    userAgent: string;
}

export interface IAppHeader {
    "X-Client-Type": string;
    "X-Client-Version": string;
    "X-User-Ip": string;
    "X-User-Agent": string;
}
// Form data for requesting password reset token,
// or change email.
export interface IEmail {
    email: string;
}

// Data converted from `IPwResetFormData` and passed to API
export interface IPasswordReset {
    token: string;
    password: string;
}

export interface INameFormData {
    userName: string;
}

export interface IMobileFormData {
    mobile: string;
}

export interface IPasswords {
    oldPassword: string;
    newPassword: string;
}

export interface IProfileFormData {
    familyName?: string;
    givenName?: string;
    gender?: string;
    birhtday?: string;
}

@jsonObject
export class Profile {
    @jsonMember
    id: string;

    @jsonMember
    email: string;

    @jsonMember
    userName?: string;

    @jsonMember
    mobile?: string;

    @jsonMember
    avatarUrl?: string;

    @jsonMember
    gender?: Gender;

    @jsonMember
    familyName?: string;

    @jsonMember
    givenName?: string;

    @jsonMember
    birthday?: string;

    @jsonMember
    telephone?: string;

    @jsonMember
    createdAt?: string;

    @jsonMember
    updatedAt?: string;

    get genderCN(): string {
        if (!this.gender) {
            return "";
        }

        return localizeGender(this.gender);
    }

    get updateNameLink(): string {
        return profileMap.displayName;
    }

    get updateMobileLink(): string {
        return profileMap.mobile;
    }

    get updateInfoLink(): string {
        return profileMap.personal;
    }

    get updateAddressLink(): string {
        return profileMap.address;
    }
}

@jsonObject
export class Address {

    @jsonMember
    country?: string;

    @jsonMember
    province?: string;

    @jsonMember
    city?: string;

    @jsonMember
    district?: string;

    @jsonMember
    street?: string;

    @jsonMember
    postcode?: string;
}

export interface IAddress extends Address {

}
