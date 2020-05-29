import {
    URL,
} from "url";
import validator from "validator";
import {
    IAuthorizeRequest,
    IErrorResp,
} from "../models/ftc-oauth";
import {
    isProduction,
} from "../config/viper";
import { 
    Account 
} from "../models/reader";
import {
    oauthRepo 
} from "../repository/oauth";
import { 
    APIError, 
    IFetchResult 
} from "../repository/api-response";
import { 
    Dictionary 
} from "../models/data-types";
import { 
    UIBase 
} from "./ui";

export interface IAuthorizeFormData {
    approve: "true" | "false";
}

interface IInvalidParams extends IErrorResp {
    shouldRedirect: boolean,
}

// Validation result for authorization request.
interface IParamState {
    values?: IAuthorizeRequest;
    errors?: IInvalidParams;
}

// Validation result for buttons.
interface IFormState {
    approve: boolean;
    errors?: IInvalidParams;
}

// Result for applying authorization grant code.
interface ICodeResult extends IFetchResult<string> {
    errParam?: IInvalidParams;
}

interface UIAuthorize extends UIBase {
    invalid?: string
}

class OAuthViewModel {

    private readonly apiErrMsg: Dictionary<string> = {
        redirectUri_missing_field: "参数缺失: redirect_uri",
        redirectUri_invalid: "无效的回调地址",
        clientId_missing: "参数缺失: client_id",
        userId_missing: "参数缺失: userId",
        loginMethod_invalid: "登录方式无效",
    }

    buildUI(errParam?: IErrorResp, errResp?: APIError): UIAuthorize {
        let msg: string = "";
        if (errParam) {
            msg = errParam.error_description || errParam.error
        }
        return {
            errors: errResp ? {
                message: errResp.message
            } : undefined,
            invalid: msg,
        };
    }

    validateRequest(query: IAuthorizeRequest): IParamState {
        if (!query.client_id) {
            return {
                errors: {
                    error: "invalid_request",
                    error_description: "参数缺失: client_id",
                    shouldRedirect: false
                },
            };
        }

        if (!query.redirect_uri) {
            return {
                errors: {
                    error: "invalid_request",
                    error_description: "参数缺失: redirect_uri",
                    shouldRedirect: false,
                },
            };
        }

        try {
            const redirectUrl = new URL(query.redirect_uri);

            if (isProduction && redirectUrl.hostname != "www.ftacademy.cn") {
                return {
                    errors: {
                        error: "unauthorized_client",
                        error_description: `client_id: ${query.client_id} 无权执行此操作`,
                        shouldRedirect: false,
                    },
                };
            }
        } catch (e) {
            return {
                errors: {
                    error: "invalid_request",
                    error_description: "无效的回调地址",
                    shouldRedirect: false,
                },
            };
        }

        if (!query.responst_type) {
            return {
                errors: {
                    error: "invalid_request",
                    error_description: "参数缺失: responst_type",
                    shouldRedirect: true,
                },
            };
        }

        if (query.responst_type != "code") {
            return {
                errors: {
                    error: "unsupported_response_type",
                    error_description: "response_type 不支持",
                    shouldRedirect: true,
                },
            };
        }

        if (!query.state) {
            return {
                errors: {
                    error: "invalid_request",
                    error_description: "参数缺失: state",
                    shouldRedirect: true,
                },
            };
        }

        return {
            values: query,
        };
    }

    validateForm(formData: IAuthorizeFormData): IFormState {
        if (validator.isBoolean(formData.approve)) {
            return {
                approve: true,
            };
        }

        return {
            approve: false,
            errors: {
                error: "access_denied",
                shouldRedirect: true,
            },
        };
    }

    validate(params: IAuthorizeRequest, formData: IAuthorizeFormData): IParamState {
        const { values, errors } = this.validateRequest(params);

        if (errors) {
            return {
                errors,
            };
        }

        const formResult = this.validateForm(formData);
        if (formResult.errors) {
            return {
                errors: formResult.errors
            };
        }

        return {
            values,
        };
    }
    /**
     * @description Request to grant an authorization code.
     * Error data could be:
     * 404 Not Found if the client_id does not exist
     * 422 Unprocessable for:
     * redirectUri: missing_field | invalid
     * clientId: missing_field
     * userId: missing_field
     * loginMethod: invalid
     */
    async requestCode(params: IAuthorizeRequest, account: Account): Promise<ICodeResult> {

        try {
            const code = await oauthRepo.requestCode(params, account);

            return {
                success: code,
            };
        } catch (e) {
            const errResp = new APIError(e);

            if (errResp.notFound) {
                return {
                    errParam: {
                        error: "unauthorized_client",
                        error_description: "未授权的客户端",
                        shouldRedirect: false,
                    },
                };
            }

            if (errResp.unprocessable) {
              const key = errResp.unprocessable.field + "_" + errResp.unprocessable.code
                return {
                    errParam: {
                        error: "invalid_request",
                        error_description: this.apiErrMsg[key],
                        shouldRedirect: false,
                    }
                }
            }

            return {
                errResp,
            }
        }
    }
}

export const oauthViewModel = new OAuthViewModel();
