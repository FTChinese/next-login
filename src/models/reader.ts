import {
    jsonObject,
    jsonMember,
    TypedJSON,
} from "typedjson";
import {
    genders
} from "./localization";
import {
    profileMap,
    accountMap,
} from "../config/sitemap";

export interface ICredentials {
    email: string;
    password: string;
}

export type LoginMethod = "email" | "wechat";
export type PaymentMethod = "alipay";
export type Tier = "standard" | "premium";
export type Cycle = "month" | "year";
export type Gender = "M" | "F";
export type Platform = "web" | "ios" | "android"
export type SubStatus = "active" | "canceled" | "incomplete" | "incomplate_expired" | "past_due" | "trialing" | "unpaid";

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
}

export interface IAccountId {
    compoundId: string;
    ftcId?: string;
    unionId?: string;
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
    loginMethod?: LoginMethod;

    @jsonMember
    wechat: Wechat;

    @jsonMember
    membership: Membership;

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
        return this.isFtcOnly && !this.isVerified;
    }

    get requestVerificationLink(): string {
        return accountMap.requestVerification;
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

export interface IPasswordsFormData {
    oldPassword: string;
    password: string;
    confirmPassword: string;
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

        return genders.get(this.gender) || "";
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
