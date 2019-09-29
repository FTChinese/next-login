import {
    ISessionState,
    ICallbackParams,
    OAuthClient,
} from "../models/wx-oauth";
import {
    Account,
    IAppHeader,
} from "../models/reader";
import {
    isExpired,
} from "../util/time";
import { entranceMap } from "../config/sitemap";
import { accountRepo } from "../repository/account";

interface ICodeData {
    state: ISessionState;
    redirectUrl: string;
}

// Validation errors.
interface ICallbackFailure {
    code?: string;
    state?: string;
}

interface UIInvalidCallback {
    message: ICallbackFailure;
    loginLink: string;
}

class WxLoginViewModel {

    private missingParam = "请求缺失参数";
    private denied = "您拒绝了微信授权";
    private stateMismatched = "无效的访问";
    private sessionNotFound = "无效的session";
    private expired = "状态已失效";

    codeRequest(): ICodeData {
        const client = new OAuthClient();

        const state = client.generateState();

        return {
            state,
            redirectUrl: client.buildCodeUrl(state.v),
        };
    }

    validateCallback(params: ICallbackParams, sessState?: ISessionState): ICallbackFailure | null {
        if (!sessState) {
            return {
                state: this.sessionNotFound,
            };
        }

        if (!params.state) {
            return {
                state: this.missingParam,
            };
        }

        if (!params.code) {
            return {
                code: this.denied,
            };
        }

        if (params.state != sessState.v) {
            return {
                state: this.stateMismatched,
            };
        }

        // The session is valid for 5 minutes
        if (isExpired(sessState.t, 5 * 60)) {
            return {
                state: this.expired,
            };
        }

        return null;
    }

    buildInvalidCbUi(result: ICallbackFailure): UIInvalidCallback {
        return {
            message: result,
            loginLink: entranceMap.login,
        }
    }

    async logIn(code: string, app: IAppHeader): Promise<Account> {
        const wxSession = await accountRepo.fetchWxSession(code, app);

        const account = await accountRepo.fetchWxAccount(wxSession.unionId);

        return account;
    }
}

export const wxLoginViewModel = new WxLoginViewModel();
