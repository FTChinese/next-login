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
import debug from "debug";
import {
    Dictionary,
} from "./data-types";
import {
    IWxApp,
    viper,
} from "../config/viper";
import {
    subsApi,
} from "../config/api";
import {
    unixNow,
} from "../util/time";
import {
    pool,
} from "../util/random";


const chance = new Chance();
const log = debug("user:wx-oauth");

interface ICodeRequestParams extends Dictionary<string> {
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
 * When redirecting user to Wechat login page, we need to create
 * the `state` parameter and validate it after redirection.
 * The `state` and its creation time is stored in session so that
 * we can retrieve to validate the redirected parameters.
 */
export interface OAuthSession {
    state: string;
    created: number;
    usage: WxOAuthUsage;
}

/**
 * @description `OAuthClient` is used to create an OAuth code request to Wechat API.
 */
export class OAuthClient {
    private app: IWxApp = viper.getConfig().wxapp.web_oauth;
    private codeUrl: string = "https://open.weixin.qq.com/connect/qrconnect";

    /**
     * @description Generate session data to be used
     * to verify callback parameters.
     */
    generateSession(usage: WxOAuthUsage): OAuthSession {
        return {
            state: chance.string({
                pool,
                length: 12,
            }),
            created: unixNow(),
            usage,
        };
    }

    /**
     * @description Create the url to request OAuth code.
     * `sandbox` determines the callback url to use.
     */
    buildCodeUrl(state: string, sandbox: boolean): string {
        const params: ICodeRequestParams = {
            appid: this.app.app_id,
            redirect_uri: subsApi.wxRedirect(sandbox),
            response_type: "code",
            scope: "snsapi_login",
            state: state,
        }

        log(`Sandbox: ${sandbox}. Redirect uri: ${params.redirect_uri}`);
        
        const requestCodeUrl = new URL(this.codeUrl);
        requestCodeUrl.search = (new URLSearchParams(params)).toString();
        requestCodeUrl.hash = "wechat_redirect";

        return requestCodeUrl.href;
    }
}

export const oauthClient = new OAuthClient();

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



