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
import {
    pool,
} from "../util/random";
import {
    Account,
} from "./reader";

const chance = new Chance();

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

// The purpose of initiating wechat
// oauth workflow.
export type WxOAuthUsage = "login" | "link";

/**
 * @description Client-side session data.
 */
export interface IOAuthSession {
    state: string;
    created: number;
    usage: WxOAuthUsage;
}



export class OAuthClient {
    private app: IWxApp = viper.getConfig().wxapp.web_oauth;
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

    generateSession(account?: Account): IOAuthSession {
        return {
            state: chance.string({
                pool,
                length: 12,
            }),
            created: unixNow(),
            usage: account ? "link" : "login",
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



