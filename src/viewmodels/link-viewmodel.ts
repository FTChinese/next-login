import {
    validate,
    ValidationError,
} from "@hapi/joi";
import debug from "debug";
import {
    UISingleInput,
    UIMultiInputs,
    UIBase,
    ITextInput,
    ICard,
    IRadio,
    IListItem,
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
    Membership,
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
import { AccountKind } from "../models/enums";

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

export interface ILinkingFormData {
    targetId: string;
}

interface ILinkResult extends IFetchResult<boolean>{
    errForm?: ILinkingFormData
}

interface UIMerging extends UIBase {
    cards: Array<ICard>;
    denyMerge?: string;
    form: {
        input: ITextInput;
    };
}

export interface IUnlinkFormData {
    anchor?: AccountKind;
}

interface IUnlinkFormState {
    value?: AccountKind;
    error?: string;
}

interface IUnlinkResult extends IFetchResult<boolean> {
    formState?: IUnlinkFormState;
}

interface UIUnlink extends UIBase {
    card: ICard;
    form?: {
        header: string;
        radio: IRadio;
    }
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

    buildMergeUI(accounts: ILinkingAccounts, formData: ILinkingFormData, errMsg?: string): UIMerging {

        const uiData: UIMerging = {
            errors: errMsg ? {
                message: errMsg,
            }: undefined,
            cards: [
                {
                    header: "FT中文网账号",
                    list: [
                        {
                            label: "邮箱",
                            value: accounts.ftc.email,
                        },
                        {
                            label: "会员类型",
                            value: accounts.ftc.membership.tierCN
                        },
                        {
                            label: "会员期限",
                            value: accounts.ftc.membership.expireDate || "-"
                        },
                    ],
                },
                {
                    header: "微信账号",
                    list: [
                        {
                            label: "昵称",
                            value: accounts.wx.wechat.nickname || "-",
                        },
                        {
                            label: "会员类型",
                            value: accounts.wx.membership.tierCN,
                        },
                        {
                            label: "会员期限",
                            value: accounts.wx.membership.expireDate || "-",
                        },
                    ]
                }
            ],
            form: {
                input: {
                    type: "hidden",
                    name: "targetId",
                    value: formData.targetId,
                }
            }
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

    async mergeAccount(account: Account, formData: ILinkingFormData): Promise<ILinkResult> {
        try {
            const ok = await accountRepo.link(account, formData.targetId);

            return {
                success: ok,
            };

        } catch (e) {
            // 204 if alread linked.
            // 422: 
            // field: ftcId, code: missing_field;
            // field: link, code: already_exists;
            // field: account, code: link_aready_taken
            // field: membership, code: link_already_taken
            // fieldd: memberships, code: none_expired
            // 404 Not Found if one of the account is not found from DB.
            return {
                errResp: new APIError(e),
            };
        }
    }

    validateUnlink(member: Membership, formData: IUnlinkFormData): IUnlinkFormState {
        if (!member.isMember) {
            return {};
        }

        if (!formData.anchor) {
            return {
                error: "当前账号拥有FT会员，解除绑定必须选择会员保留在哪个账号上"
            };
        }

        if (formData.anchor != "ftc" && formData.anchor != "wechat") {
            return {
                error: "必须选择会员所保留的账号",
            };
        }

        return {
            value: formData.anchor,
        };
    }

    async sever(account: Account, formData: IUnlinkFormData): Promise<IUnlinkResult> {
        // value might be empty even if not error returned.
        const { value, error } = this.validateUnlink(account.membership, formData);

        if (error) {
            return {
                formState: {
                    error,
                },
            };
        }

        try {
            const ok = await accountRepo.unlink(account, value);

            return {
                success: ok,
            };
        } catch (e) {
            return {
                errResp: new APIError(e),
            };
        }
    }

    buildUnlinkUI(account: Account, result?: IUnlinkResult): UIUnlink {
        const cardList: Array<IListItem> = [
            {
                label: "FT账号",
                value: account.email,
            },
            {
                label: "微信账号",
                value: account.wechat.nickname
            }
        ];

        if (account.membership.isMember) {
            cardList.concat([
                {
                    label: "会员类型",
                    value: account.membership.tierCN,
                },
                {
                    label: "会员期限",
                    value: account.membership.expireDate,
                }
            ]);
        }

        const { formState, errResp } = result || {};
        return {
            errors: errResp ? {
                message: errResp.message,
            } : undefined,
            card: {
                list: cardList,
            },
            form: {
                header: "检测到您是FT的会员，解除账号绑定需要选择会员信息保留在哪个账号下，请选择",
                radio: {
                    name: "anchor",
                    inputs: [
                        {
                            label: "FTC账号",
                            id: "anchorFtc",
                            value: "ftc",
                            checked: false,
                        },
                        {
                            label: "微信账号",
                            id: "anchorWechat",
                            value: "wechat",
                            checked: false,
                        }
                    ],
                    error: (formState && formState.error) 
                        ? formState.error 
                        : undefined,
                }
            },
        }
    }
}

export const linkViewModel = new LinkViewModel();
