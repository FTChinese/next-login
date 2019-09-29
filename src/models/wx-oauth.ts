import {
    URL,
    URLSearchParams,
} from "url"
import Chance from "chance";
import {
    jsonObject,
    jsonMember,
} from "typedjson";
import {
    DateTime,
} from "luxon";
import {
    Dictionary,
} from "./data-types";
import {
    IWxApp,
    viper,
} from "../config/viper";
import {
    subsApiBase,
    subsSandboxBase,
    subsApi,
} from "../config/api";
import {
    unixNow,
} from "../util/time";

export interface ICodeRequestParams extends Dictionary<string> {
    appid: string;
    redirect_uri: string;
    response_type: "code";
    scope: "snsapi_login";
    state: string;
}

export interface ICallbackParams {
    code?: string; // Won't exist if user denied authorization.
    state?: string;
}

/**
 * Store wechat login state code and the creation time
 * in session so that we could verify the callback data.
 */
export interface ISessionState {
    v: string;
    t: number;
}

const chance = new Chance();

export class OAuthClient {
    private app: IWxApp = viper.getConfig().wxapp.w_ftc;
    private codeUrl: string = "https://open.weixin.qq.com/connect/qrconnect";
    private subsApiBaseUrl: string;

    // The sole purpose of sandbox is test whether API
    // could be used as an itermediate transfer point.
    constructor(sandbox: boolean = false) {
        this.subsApiBaseUrl = sandbox
            ? subsSandboxBase
            : subsApiBase;
    }

    get callbackUrl(): string {
        return `${this.subsApiBaseUrl}${subsApi.wxRedirect}`;
    }

    generateState(): ISessionState {
        return {
            v: chance.string({
                pool: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                length: 12,
            }),
            t: unixNow(),
        };
    }

    buildCodeUrl(state: string): string {
        const params: ICodeRequestParams = {
            appid: this.app.app_id,
            redirect_uri: this.callbackUrl,
            response_type: "code",
            scope: "snsapi_login",
            state: state,
        }

        const requestCodeUrl = new URL(this.codeUrl);
        requestCodeUrl.search = (new URLSearchParams(params)).toString();
        requestCodeUrl.hash = "wechat_redirect";

        return requestCodeUrl.href;
    }
}

@jsonObject
export class WxSession {
    @jsonMember
    id: string;

    @jsonMember
    unionId: string;

    @jsonMember
    createdAt: string;


    isExpired(): boolean {
        const created = DateTime.fromISO(this.createdAt);
        const expireAt = created.plus({ days: 30 });

        return expireAt > DateTime.utc();
    }
}
