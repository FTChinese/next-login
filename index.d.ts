declare interface ICredentials {
    email: string;
    password: string;
}

declare interface IMembership {
    tier?: "standard" | "premium";
    cycle?: "year" | "month";
    expireDate?: string;
}

declare interface IWechat {
    nickname?: string;
    avatarUrl?: string;
}

declare interface IAccount {
    id: string;
    unionId?: string;
    userName?: string;
    email: string;
    isVerified: boolean;
    avatar?: string;
    isVip: boolean;
    loginMethod: "email" | "wechat";
    wechat: IWechat;
    membership: IMembership;
}

declare interface IAddress {
    country?: string;
    province?: string;
    city?: string;
    district?: string;
    street?: string;
    postcode?: string;
}

declare interface INewsletter {
    todayFocus: boolean,
    weeklyChoice: boolean,
    afternoonExpress: boolean
}

declare interface IProfile {
    id: string;
    email: string;
    userName?: string;
    mobile?: string;
    avatarUrl?: string;
    gender?: "M" | "F";
    familyName?: string;
    givenName?: string;
    birthday?: string;
    telephone?: string;
    createdAt?: string; //2018-03-23T09:20:13Z
    updatedAt?: string; // 2018-03-24T06:54:03Z 
}

declare interface IOrder {
    orderId: string;
    tier: "standard" | "premium";
    cycle: "year" | "month";
    netPrice: number;
    payMethod: "wechat" | "alipay" | "stripe";
    createdAt: string;
    startDate: string;
    endDate: string;
}

// Data structure for API error response.
declare interface APIError {
    message: string,
    error?: {
        field: string,
        code: string, // Possbile value: missing | missing_field | invalid | already_exists
    }
}

declare interface ErrorForUI {
    server?: string;
    credentials?: string;
    email?: string;
    password?: string;
}

// Possbile data passed in redirect.
declare interface Alert {
    done: string,
    saved: string,
}
