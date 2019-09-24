import {
    jsonObject,
    jsonMember,
} from "typedjson";

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
}

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
export interface IEmailFormData {
    email: string;
}

// Data converted from `IPwResetFormData` and passed to API
export interface IPasswordReset {
    token: string;
    password: string;
}

// Form data submitted on the resetting password page.
export interface IPwResetFormData {
    password: string;
    confirmPassword: string;
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

export class IProfile {
    id: string;
    email: string;
    userName?: string;
    mobile?: string;
    avatarUrl?: string;
    gender?: Gender;
    familyName?: string;
    givenName?: string;
    birthday?: string;
    telephone?: string;
    createdAt?: string;
    updatedAt?: string;
}

export class IAddress {
    country?: string;
    province?: string;
    city?: string;
    district?: string;
    street?: string;
    postcode?: string;
}
