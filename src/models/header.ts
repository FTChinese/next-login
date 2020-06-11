export const KEY_USER_ID = "X-User-Id";
export const KEY_UNION_ID = "X-Union-Id";
export const KEY_APP_ID = "X-App-Id";

export interface HeaderReaderId {
    [KEY_USER_ID]?: string;
    [KEY_UNION_ID]?: string;
}

export interface HeaderWxAppId {
    [KEY_APP_ID]: string;
}

export interface HeaderApp {
    "X-Client-Type": string;
    "X-Client-Version": string;
    "X-User-Ip": string;
    "X-User-Agent": string;
}
