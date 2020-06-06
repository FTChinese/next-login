import {
    ICallbackParams,
    OAuthSession,
    WxSession,
    WxOAuthUsage,
    oauthClient,
} from "../models/wx-oauth";
import {
    Account,
} from "../models/reader";
import {
    IHeaderApp,
} from "../models/header";
import {
    isExpired,
} from "../util/time";
import { entranceMap, accountMap } from "../config/sitemap";
import { accountService } from "../repository/account";
import { UIBase } from "./ui";
import { IFetchResult, APIError } from "../repository/api-response";
import { IFormState } from "../pages/validator";

interface IOAuthCodeRequest {
    session: OAuthSession,
    redirectUrl: string;
}

interface IOAuthResult extends IFetchResult<WxSession> {
    errQuery?: ICallbackParams;
}

interface UIFailure extends UIBase {
    reason?: ICallbackParams;
    link: string;
}

class WxLoginViewModel {

    private missingParam = "请求缺失参数";
    private denied = "您拒绝了微信授权";
    private stateMismatched = "无效的访问";
    private sessionNotFound = "无效的session";
    private expired = "状态已失效";

    // Build redirect url and the session data to be persisted on client-side.
    codeRequest(usage: WxOAuthUsage, sandbox: boolean): IOAuthCodeRequest {

        const sess = oauthClient.generateSession(usage)

        return {
            session: sess,
            redirectUrl: oauthClient.buildCodeUrl(sess.state, sandbox),
        };
    }

    /**
     * @description Validate callback data.
     * Treat the query parameter as form inputs.
     */
    validate(params: ICallbackParams, sess?: OAuthSession): IFormState<ICallbackParams> {
        
        if (!sess) {
            return {
                errors: {
                    state: this.sessionNotFound,
                }
            };
        }

        if (!params.state) {
            return {
                errors: {
                    state: this.missingParam,
                }
            };
        }

        if (!params.code) {
            return {
                errors: {
                    code: this.denied,
                },
            };
        }

        params.state = params.state.trim();
        params.code = params.code.trim();

        if (params.state != sess.state) {
            return {
                errors: {
                    state: this.stateMismatched,
                },
            };
        }

        // The session is valid for 5 minutes
        if (isExpired(sess.created, 5 * 60)) {
            return {
                errors: {
                    state: this.expired,
                },
            };
        }

        return {
            values: params,
        };
    }

    async getApiSession(params: ICallbackParams, app: IHeaderApp, sess?: OAuthSession): Promise<IOAuthResult> {
        const { values, errors } = this.validate(params, sess);
        if (!values) {
            return {
                errQuery: errors,
            };
        }

        try {
            const wxSession = await accountService.fetchWxSession(values.code!, app);
            return {
                success: wxSession,
            };
        } catch (e) {
            return {
                errResp: new APIError(e),
            };
        }
    }

    buildUI(result: IOAuthResult, account?: Account): UIFailure {
        return {
            errors: result.errResp
                ? { message: result.errResp.message }
                : undefined,
            reason: result.errQuery,
            link: account ? accountMap.base : entranceMap.login,
        };
    }

    async getAccount(wxSession: WxSession): Promise<IFetchResult<Account>> {
        try {

            const account = await accountService.fetchWxAccount(wxSession.unionId);
    
            return {
                success: account,
            };
        } catch (e) {
            return {
                errResp: new APIError(e),
            };
        }
    }
}

export const wxLoginViewModel = new WxLoginViewModel();
