import {
    validate,
    ValidationError,
} from "@hapi/joi";
import debug from "debug";
import {
    UIBase, 
    ITextInput,
    IListItem,
    IFormState,
    IUpdateResult,
    SavedKey,
    getDoneMsg,
} from "./ui";
import {
    APIError,
} from "./api-error";
import {
    emailSchema,
    passwordUpdatingSchema,
    buildJoiErrors,
} from "./validator";
import {
    Account,
    IEmail,
} from "../models/reader";

import {
    accountRepo,
} from "../repository/account";

import {
    accountMap, entranceMap,
} from "../config/sitemap";

const log = debug("user:profile-viewmodel");

interface ISection {
    heading?: string;
    items: Array<IListItem>;
}

export interface IPasswordsFormData {
    oldPassword: string;
    password: string;
    confirmPassword: string;
}

interface UIAccount extends UIBase {
    sections?: Array<ISection>;
}

interface UIUpdateEmail extends UIBase {
    input?: ITextInput;
}

interface UIUPdatePassword extends UIBase {
    inputs: Array<ITextInput>;
    passwordResetLink: string;
}

class AccountViewModel {
    
    private readonly msgNotFound = "用户不存在或服务器错误！";
    private readonly msgPwIncorrect = "当前密码错误";


    async buildAccountUI(account: Account, done?: SavedKey): Promise<UIAccount> {

        const success = await accountRepo.fetchFtcAccount(account.id)

        return {
            alert: done
                ? { message: getDoneMsg(done) }
                : undefined,
            sections: [
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
                            value: account.isLinked()
                                ? `已绑定 ${account.wechat.nickname}`
                                : "",
                            link: account.isLinked()
                                ? accountMap.unlinkWx
                                : accountMap.linkEmail,
                            linkText: account.isLinked()
                                ? "解除绑定"
                                : "尚未绑定"
                        }
                    ]
                }
            ],
        };
    }

    /**
     * @description Update email.
     */
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

    async updateEmail(account: Account, formData: IEmail): Promise<IUpdateResult<IEmail>> {
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
                const o = errResp.error.toMap();

                log("Error message: %O", o);

                return {
                    errForm: {
                        email: o.get("email") || ""
                    }
                };
            }

            return {
                errApi: {
                    message: errResp.message,
                },
            };
        }
    }

    async buildEmailUI(account: Account, formData?: IEmail, result?: IUpdateResult<IEmail>): Promise<UIUpdateEmail> {
        if (!formData) {
            const success = await accountRepo.fetchFtcAccount(account.id);

            formData = {
                email: success.email,
            };
        }

        return {
            errors: (result && result.errApi)
                ? result.errApi
                : undefined,
            input: {
                label: "",
                id: "email",
                type: "email",
                name: "email",
                value: formData ? formData.email : "",
                placeholder: "email@example.org",
                error: (result && result.errForm)
                    ? result.errForm.email
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

    async updatePassword(account: Account, formData: IPasswordsFormData): Promise<IUpdateResult<IPasswordsFormData>> {
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
                const o = errResp.error.toMap();
                return {
                    errForm: {
                        oldPassword: o.get("oldPassword") || "",
                        password: o.get("newPassword") || "",
                        confirmPassword: "",
                    }
                };
            }

            return {
                errApi: {
                    message: errResp.message
                }
            };
        }
    }

    buildPasswordsUI(result?: IUpdateResult<IPasswordsFormData>): UIUPdatePassword {

        return {
            errors: (result && result.errApi) 
                ? result.errApi 
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
                    error: (result && result.errForm) 
                        ? result.errForm.oldPassword 
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
                    error: (result && result.errForm) 
                        ? result.errForm.password 
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
                    error: (result && result.errForm) 
                        ? result.errForm.password 
                        : undefined,
                },
            ],
            passwordResetLink: entranceMap.passwordReset,
        };
    }
}

export const accountViewModel = new AccountViewModel();
