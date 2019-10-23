export interface IHeaderReaderId {
    "X-User-Id"?: string;
    "X-Union-Id"?: string;
}

export interface IHeaderWxAppId {
    "X-App-Id": string;
}

export interface IHeaderApp {
    "X-Client-Type": string;
    "X-Client-Version": string;
    "X-User-Ip": string;
    "X-User-Agent": string;
}
