import {
    accountRepo,
} from "../repository/account";
import { IFetchResult, APIError } from "./api-response";
import { IAnchor } from "./ui";
import { accountMap, entranceMap } from "../config/sitemap";

interface UIVrfResult {
    message: string;
    link: IAnchor;
}

class VrfViewModel {
    async verifyEmail(token: string): Promise<IFetchResult<boolean>> {
        try {
            const ok = await accountRepo.verifyEmail(token);

            return {
                success: ok,
            };
        } catch (e) {
            return {
                errResp: new APIError(e),
            };
        }
    }

    buildUI(result: IFetchResult<boolean>, loggedIn: boolean): UIVrfResult {
        let link: IAnchor;
        if (loggedIn) {
            link = {
                href: accountMap.base,
                text: "返回",
            };
        } else {
            link = {
                href: entranceMap.login,
                text: "登录",
            };
        }

        if (result.success) {
            return {
                message: "邮箱已验证！",
                link,
            };
        }

        if (result.errResp) {
            if (result.errResp.notFound) {
                return {
                    message: "邮箱验证失败！",
                    link,
                };
            }

            return {
                message: result.errResp.message,
                link,
            };
        }

        return {
            message: "Unknow error occurred.",
            link,
        };
    }
}

export const vrfViewModel = new VrfViewModel();
