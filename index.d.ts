declare interface Credentials {
    email: string;
    password: string;
}
declare interface Membership {
    tier: "free" | "standard" | "premium";
    startAt: string;
    expireAt: string;
}
declare interface Account {
    id: string;
    userName: string;
    avatar: string;
    isVip: boolean;
    isVerified: boolean;
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

declare interface SuperAgentResponse {
    header: Object,
    links: Object,
    status: number,
    statusType: number,
    info: boolean,
    ok: boolean,
    redirect: boolean,
    clientError: boolean,
    serverError: boolean,
    error: Error,
    accepted: boolean,
    noContent: boolean,
    badRequest: boolean,
    unauthorized: boolean,
    noAcceptable: boolean,
    forbidden: boolean,
    notFound: boolean,
    text: string,
    body: Object,
}

declare interface SuperAgentError {
    status: number,
    response: SuperAgentResponse, // body will be APIError
}

declare interface APIErrorBody {
    message: string,
    error?: {
        field: string,
        code: string, // Possbile value: missing | missing_field | invalid | already_exists
    }
}

declare interface InvalidError {
    // a string by joining JoiErr's path field using underscore. For exaple, if `path: ["email"]`, the key will be `email`; if `path: ["user", "name"]`, the key will be `user_name`.
    field: string,
    // JoiErrDetail's type field
    type: string,
    // A message id to search for localized text.
    msg: string 
}

// An object of unkonwn keys with know value structure.
// The key is the value of InvalidError.field, or APIErrorBody.error.field
declare interface InvalidFields {
    [key: string]: {
        type: string, // InvalidError.type, or APIErrorBody.error.code
        message: string, // User-friedly error message
    }
}

// Possbile data passed in redirect.
declare interface Alert {
    done: string,
    saved: string,
}

declare interface JoiErr {
    isJoi: boolean, // always true
    name: string, // always 'ValidationError'
    details: JoiErrDetail[],
}

declare interface JoiErrDetail {
    message: string, // '"email" must be a valid email'
    path: string[], // path to schema keys. null if you schema does not have any named properties.
    type: string, // string.email, any.required, string.min, string.max
    context: {
        key: string, // Last element in path
        label: string,
        value?: string,
        limit?: number // If type is string.min or string.max
    }
}

declare interface JoiResult {
    error?: JoiErr,
    value: Object,
}