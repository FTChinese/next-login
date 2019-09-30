import {
    validate,
    ValidationError,
} from "@hapi/joi";
import debug from "debug";
import {
    UISingleInput,
    UIMultiInputs,
} from "./ui";

import {
    emailSchema,
    loginSchema,
    signUpSchema,
    buildJoiErrors,
    IFormState,
    ISignUpFormData,
} from "./validator";

import {
    IEmail,
    ICredentials,
    IAppHeader,
    Account,
} from "../models/reader";

import {
    accountRepo,
} from "../repository/account";
import { 
    APIError, IFetchResult,
} from "./api-response";
import { 
    entranceMap,
} from "../config/sitemap";

const log = debug("user:link-viewmodel");

interface IEmailExistsResult extends IFetchResult<boolean> {
    errForm?: IEmail;
}

// Authentication result if user already has an ftc account.
interface IAuthenticateResult extends IFetchResult<string> {
    errForm?: ICredentials;
}

interface ISignUpResult extends IFetchResult<string> {
    errForm?: ISignUpFormData;
}

interface UILogin extends UIMultiInputs {
    pwResetLink: string;
}

interface ILinkingAccounts {
    ftc: Account;
    wx: Account;
}

interface UIAccountCard {
    header: string;
    name: string;
    memberType: string;
    expiration: string;
}

interface UIMerging {
    cards: Array<UIAccountCard>;
    denyMerge?: string;
}

class LinkViewModel {
    private readonly msgInvalidCredentials = "邮箱或密码错误";
    
    async validateEmail(data: IEmail): Promise<IFormState<IEmail>> {
        try {
            const result = await validate<IEmail>(data, emailSchema);

            return {
                values: result,
            };
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as IEmail,
            };
        }
    }

    async checkEmail(formData: IEmail): Promise<IEmailExistsResult> {
        const { values, errors } = await this.validateEmail(formData);

        if (errors) {
            return {
                errForm: errors,
            };
        }

        if (!values) {
            throw new Error("invalid form data to check email existence");
        }

        try {
            const ok = await accountRepo.emailExists(formData.email)

            return {
                success: ok,
            };
        } catch (e) {
            const errResp = new APIError(e);
            if (errResp.error) {
                const o = errResp.error.toMap();
                return {
                    errForm: {
                        email: o.get("email") || ""
                    },
                }
            }

            return {
                errResp: new APIError(e),
            };
        }
    }

    buildEmailUI(formData?: IEmail, result?: IEmailExistsResult): UISingleInput {
        const uiData: UISingleInput = {
            input: {
                label: "",
                id: "email",
                type: "email",
                name: "email",
                value: formData ? formData.email : "",
                placeholder: "电子邮箱",
                maxlength: "64",
                required: true,
                error: (result && result.errForm)
                    ? result.errForm.email
                    : undefined,
            }
        };

        if (result && result.errResp) {
            uiData.errors = {
                message: result.errResp.message,
            };
        }

        return uiData;
    }

    async validateLogin(formData: ICredentials): Promise<IFormState<ICredentials>> {
        try {
            const result = await validate<ICredentials>(formData, loginSchema);

            return {
                values: result,
            }
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as ICredentials,
            };
        }
    }

    async logIn(formData: ICredentials, app: IAppHeader): Promise<IAuthenticateResult> {
        const { values, errors } = await this.validateLogin(formData);

        if (errors) {
            return {
                errForm: errors,
            };
        }

        if (!values) {
            throw new Error("invalid form data to login");
        }

        try {
            const ftcId = await accountRepo.authenticate(values, app);

            return {
                success: ftcId,
            };

        } catch (e) {
            const errResp = new APIError(e);

            log("%O", e);

            if (errResp.error) {
                const o = errResp.error.toMap();

                return {
                    errForm: {
                        email: o.get("email") || "",
                        password: o.get("password") || "",
                    },
                };
            }

            return {
                errResp,
            };
        }
    }

    buildLoginUI(formData?: ICredentials, result?: IAuthenticateResult): UILogin {
        if (formData && formData.email) {
            formData.email = formData.email.trim();
        }

        const { errForm, errResp} = result || {};

        const uiData: UILogin = {
            inputs: [
                {
                    label: "邮箱",
                    id: "email",
                    type: "email",
                    name: "credentials[email]",
                    value: formData ? formData.email : "",
                    placeholder: "电子邮箱",
                    maxlength: "64",
                    required: true,
                    readonly: true,
                    error: errForm ? errForm.email : "",
                },
                {
                    label: "密码",
                    id: "password",
                    type: "password",
                    name: "credentials[password]",
                    placeholder: "密码",
                    maxlength: "64",
                    required: true,
                    error: errForm ? errForm.password : "",
                }
            ],
            pwResetLink: entranceMap.passwordReset,
        };

        if (errResp) {
            // In case credentials are not correct.
            if (errResp.notFound || errResp.forbidden) {
                uiData.alert = {
                    message: this.msgInvalidCredentials,
                }

                return uiData;
            }

            uiData.errors = {
                message: errResp.message,
            };

            return uiData;
        }

        return uiData;
    }

    async validateSignUp(formData: ISignUpFormData): Promise<IFormState<ISignUpFormData>> {
        try {
            const result = await validate<ISignUpFormData>(formData, signUpSchema);

            return {
                values: result,
            };
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as ISignUpFormData,
            };
        }
    }

    async signUp(
        formData: ISignUpFormData, 
        account: Account, 
        app: IAppHeader
    ): Promise<ISignUpResult> {
        const { values, errors } = await this.validateSignUp(formData);

        if (errors) {
            return {
                errForm: errors,
            }
        }

        if (!values) {
            throw new Error("invalid form to sign up");
        }

        if (!account.unionId) {
            throw new Error("not logged in with wechat");
        }

        try {
            const ftcId = await accountRepo.wxSignUp(
                {
                    email: values.email,
                    password: values.password,
                },
                account.unionId, 
                app
            );

            return {
                success: ftcId,
            };
        } catch (e) {
            const errResp = new APIError(e);

            if (errResp.error) {
                const o = errResp.error.toMap();

                return {
                    errForm: {
                        email: o.get("email") || "",
                        password: o.get("password") || "",
                        confirmPassword: o.get("confirmPassword") || "",
                    },
                };
            }

            return {
                errResp,
            }
        }
    }

    buildSignUpUI(
        formData?: ISignUpFormData,
        result?: ISignUpResult,
    ): UIMultiInputs {
        if (formData && formData.email) {
            formData.email = formData.email.trim();
        }

        const { errForm, errResp } = result || {};

        return {
            errors: errResp 
                ? { message: errResp.message }
                : undefined,
            inputs: [
                {
                    label: "邮箱",
                    id: "email",
                    type: "email",
                    name: "credentials[email]",
                    value: formData ? formData.email : "",
                    placeholder: "电子邮箱",
                    maxlength: "64",
                    required: true,
                    readonly: true,
                    desc: "注册后邮箱或者微信均可登录",
                    error: errForm ? errForm.email : "",
                },
                {
                    label: "密码",
                    id: "password",
                    type: "password",
                    name: "credentials[password]",
                    placeholder: "密码",
                    maxlength: "64",
                    required: true,
                    desc: "最少8个字符",
                    error: errForm 
                        ? errForm.password 
                        : "",
                },
                {
                    label: "确认密码",
                    id: "confirmPassword",
                    type: "password",
                    name: "credentials[confirmPassword]",
                    placeholder: "再次输入密码",
                    maxlength: "64",
                    required: true,
                    error: errForm 
                        ? errForm.confirmPassword 
                        : "",
                },
            ],
        };
    }

    async fetchAccountToLink(account: Account, targetId: string): Promise<ILinkingAccounts> {
        switch (account.loginMethod) {
            case "email": {
                const wxAccount = await accountRepo.fetchWxAccount(targetId);

                return {
                    ftc: account,
                    wx: wxAccount,
                };
            }

            case "wechat": {
                const ftcAccount = await accountRepo.fetchFtcAccount(targetId);

                return {
                    ftc: ftcAccount,
                    wx: account,
                };
            }

            default: {
                throw new Error("cannot determine current account type");
            }
        }
    }

    buildMergeUI(accounts: ILinkingAccounts): UIMerging {

        const uiData: UIMerging = {
            cards: [
                {
                    header: "FT中文网账号",
                    name: accounts.ftc.email,
                    memberType: accounts.ftc.membership.tierCN,
                    expiration: accounts.ftc.membership.expireDate || "-"
                },
                {
                    header: "微信账号",
                    name: accounts.wx.wechat.nickname || "-",
                    memberType: accounts.wx.membership.tierCN,
                    expiration: accounts.wx.membership.expireDate || "-"
                }
            ],
        };

        if (accounts.ftc.isEqual(accounts.wx)) {
            uiData.denyMerge = `两个账号已经绑定，无需操作。如果您未看到绑定后的账号信息，请点击"账号安全"刷新。`;

            return uiData;
        }

        if (accounts.ftc.isLinked()) {
            uiData.denyMerge = `账号 ${accounts.ftc.email} 已经绑定了其他微信账号。一个FT中文网账号只能绑定一个微信账号。`;

            return uiData;
        }

        if (accounts.wx.isLinked()) {
            uiData.denyMerge = `微信账号 ${accounts.wx.wechat.nickname} 已经绑定了其他FT中文网账号。一个FT中文网账号只能绑定一个微信账号。`;

            return uiData;
        }

        if (!accounts.ftc.membership.isExpired && !accounts.wx.membership.isExpired) {
            uiData.denyMerge = `您的微信账号和FT中文网的账号均购买了会员服务，两个会员均未到期。合并账号会删除其中一个账号的会员信息。为保障您的权益，暂不支持绑定两个会员未过期的账号。您可以寻求客服帮助。`;

            return uiData;
        }

        return uiData;
    }
}

export const linkViewModel = new LinkViewModel();
