import {
    validate,
    ValidationError,
} from "@hapi/joi";
import debug from "debug";
import {
    UIBase, 
    IListItem,
    UISingleInput,
    UIMultiInputs,
} from "./ui";
import {
    APIError,
    IFetchResult,
} from "./api-response";
import {
    emailSchema,
    passwordUpdatingSchema,
    buildJoiErrors,
    IFormState,
} from "../pages/validator";
import {
    Account,
    EmailData,
} from "../models/reader";
import {
    IHeaderApp,
} from "../models/header";
import {
    accountRepo,
} from "../repository/account";

import {
    accountMap, 
    entranceMap,
} from "../config/sitemap";
import { KeyUpdated, getMsgUpdated } from "./redirection";

const log = debug("user:profile-viewmodel");

interface ISection {
    heading?: string;
    items: Array<IListItem>;
}

interface UIAccount extends UIBase {
    sections?: Array<ISection>;
}

interface IUpdateEmailResult extends IFetchResult<boolean> {
    errForm?: EmailData;
}

export interface IPasswordsFormData {
    oldPassword: string;
    password: string;
    confirmPassword: string;
}

interface IUpdatePwResult extends IFetchResult<boolean> {
    errForm?: IPasswordsFormData;
}

interface UIUPdatePassword extends UIMultiInputs {
    passwordResetLink: string;
}

class AccountViewModel {
    
    private readonly msgNotFound = "用户不存在或服务器错误！";
    private readonly msgPwIncorrect = "当前密码错误";

    async refresh(account: Account): Promise<IFetchResult<Account>> {
        try {
            switch (account.loginMethod) {
                case "email": {
                    const acnt = await accountRepo.fetchFtcAccount(account.id);

                    return {
                        success: acnt,
                    };
                }

                case "wechat": {
                    const acnt = await accountRepo.fetchWxAccount(account.unionId!);

                    return {
                        success: acnt,
                    }
                }
    
                default:
                    throw new Error("unknown account type");
            }
        } catch (e) {
            return {
                errResp: new APIError(e),
            };
        }
    }

    buildAccountUI(result?: IFetchResult<Account>, done?: KeyUpdated): UIAccount {
        const { success, errResp } = result || {};
        return {
            errors: errResp ? {
                message: errResp.notFound
                    ? this.msgNotFound
                    : errResp.message
            } : undefined,
            alert: done
                ? { message: getMsgUpdated(done) }
                : undefined,
            sections: success ? [
                {
                    items: [
                        {
                            label: "登录邮箱",
                            value: success.email,
                            link: accountMap.email,
                        },
                        {
                            label: "密码",
                            link: accountMap.password,
                        }
                    ],
                },
                {
                    heading: "账号绑定",
                    items: [
                        {
                            label: "微信",
                            value: success.isLinked()
                                ? `已绑定 ${success.wechat.nickname}`
                                : "",
                            link: success.isLinked()
                                ? accountMap.unlinkWx
                                : entranceMap.wxLogin,
                            linkText: success.isLinked()
                                ? "解除绑定"
                                : "尚未绑定"
                        }
                    ]
                }
            ] : undefined,
        };
    }

    /**
     * @description Update email.
     */
    async validateEmail(data: EmailData): Promise<IFormState<EmailData>> {
        try {
            const result = await validate<EmailData>(data, emailSchema);

            return {
                values: result,
            };
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as EmailData,
            };
        }
    }

    async updateEmail(account: Account, formData: EmailData): Promise<IUpdateEmailResult> {
        const { values, errors } = await this.validateEmail(formData);

        if (errors) {
            return {
                errForm: errors,
            }
        }

        if (!values) {
            throw new Error("invalid form data to change email");
        }

        try {
            const ok = await accountRepo.updateEmail(
                account.id,
                values,
            );

            return {
                success: ok,
            };
        } catch (e) {

            const errResp = new APIError(e);

            if (errResp.error) {
                // error.field: "email"
                // error.code: "missing_field" | "invalid"
                const o = errResp.error.toMap();

                return {
                    errForm: {
                        email: o.get(errResp.error.code) || "",
                    },
                };
            }

            return {
                errResp,
            };
        }
    }

    /**
     * `formData` should always present unless API errored and data cannot be fetch.
     * For GET use `Account` to compose this `formData`;
     * For POSt just use the submitted form data.
     */
    buildEmailUI(formData?: EmailData, result?: IUpdateEmailResult): UISingleInput {

        const { errForm, errResp } = result || {};

        return {
            errors: errResp
                ? { message: errResp.message }
                : undefined,
            input: {
                label: "",
                id: "email",
                type: "email",
                name: "email",
                value: formData ? formData.email : "",
                placeholder: "email@example.org",
                error: errForm
                    ? errForm.email
                    : undefined,
            }
        };
    }

    async validatePasswords(data: IPasswordsFormData): Promise<IFormState<IPasswordsFormData>> {
        try {
            const result = await validate<IPasswordsFormData>(data, passwordUpdatingSchema);

            return {
                values: result,
            };
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as IPasswordsFormData,
            };
        }
    }

    async updatePassword(account: Account, formData: IPasswordsFormData): Promise<IUpdatePwResult> {
        const { values, errors } = await this.validatePasswords(formData);

        if (errors) {
            return {
                errForm: errors,
            }
        }

        if (!values) {
            throw new Error("invalid form data to change password");
        }

        try {
            const ok = await accountRepo.updatePassword(
                account.id,
                {
                    oldPassword: values.oldPassword,
                    newPassword: values.password,
                },
            );

            return {
                success: ok,
            };
        } catch (e) {

            const errResp = new APIError(e);

            if (errResp.forbidden) {
                return {
                    errForm: {
                        oldPassword: this.msgPwIncorrect,
                        password: "",
                        confirmPassword: "",
                    },
                };
            }

            if (errResp.error) {
                // field: "oldPassword" | "newPassword"
                // code: "missing_fied" | "invalid"
                // This generates 
                const o = errResp.error.toMap();

                return {
                    errForm: {
                        oldPassword: o.get(errResp.error.field) || "",
                        password: o.get(errResp.error.field) || "",
                        confirmPassword: "",
                    }
                }
            }

            return {
                errResp,
            };
        }
    }

    buildPasswordsUI(result?: IUpdatePwResult): UIUPdatePassword {

        const { errForm, errResp} = result || {};

        return {
            errors: errResp
                ? { message: errResp.message }
                : undefined,
            inputs: [
                {
                    label: "当前密码",
                    id: "oldPassword",
                    type: "password",
                    name: "oldPassword",
                    placeholder: "",
                    required: true,
                    desc: "",
                    error: errForm 
                        ? errForm.oldPassword 
                        : undefined,
                },
                {
                    label: "新密码",
                    id: "password",
                    type: "password",
                    name: "password",
                    placeholder: "",
                    required: true,
                    minlength: "8",
                    maxlength: "64",
                    desc: "最少8个字符",
                    error: errForm
                        ? errForm.password 
                        : undefined,
                },
                {
                    label: "再次输入新密码",
                    id: "confirmPassword",
                    type: "password",
                    name: "confirmPassword",
                    placeholder: "",
                    required: true,
                    minlength: "8",
                    maxlength: "64",
                    desc: "两次输入的新密码须一致",
                    error: errForm
                        ? errForm.password 
                        : undefined,
                },
            ],
            passwordResetLink: entranceMap.passwordReset,
        };
    }

    async requestVerification(account: Account, app: IHeaderApp): Promise<IFetchResult<boolean>> {
        try {
            const ok = await accountRepo.requestVerification(account.id, app);

            return {
                success: ok,
            };
        } catch (e) {
            return {
                errResp: new APIError(e),
            };
        }
    }
}

export const accountViewModel = new AccountViewModel();
