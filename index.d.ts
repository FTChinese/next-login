declare interface Credentials {
    email: string;
    password: string;
}
declare interface Membership {
    tier: "free" | "standard" | "premium";
    startAt: string;
    expireAt: string;
}

declare interface Wechat {
    unionId: string;
    openId: string;
    nickName: string;
    avatarUrl: string;
}
declare interface Account {
    id: string;
    email: string;
    userName?: string;
    avatar?: string;
    isVip: boolean;
    isVerified: boolean;
    wechat?: Wechat;
    membership: Membership;
}

declare interface UserSession {
    id: string;
    name: string;
    avatar: string;
    vip: boolean;
    vrf: boolean;
    mbr: {
        tier: "free" | "standard" | "premium";
        start: string;
        exp: string;
    }
}

declare interface Address {
    province: string,
    city: string,
    district: string,
    street: string,
    zipCode: string,
}

declare interface Newsletter {
    todayFocus: boolean,
    weeklyChoice: boolean,
    afternoonExpress: boolean
}

declare interface Profile {
    id: string;
    userName: string;
    email: string;
    avatarUrl: string;
    gender: "M" | "F";
    familyName: string;
    givenName: string;
    phoneNumber: string;
    mobileNumber: string;
    birthdate: string;
    address: Address;
    createdAt: string; //2018-03-23T09:20:13Z
    updatedAt: string; // 2018-03-24T06:54:03Z
    newsletter: Newsletter;   
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