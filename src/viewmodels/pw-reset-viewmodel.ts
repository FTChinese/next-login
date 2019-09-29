import {
    validate,
    ValidationError,
} from "@hapi/joi";
import {
    ITextInput,
    IActionDone,
    UIBase,
    IErrors,
    ActionDoneKey,
    IFormState,
    IUpdateResult,
    IFetchResult,
} from "./ui";
import {
    buildJoiErrors,
    emailSchema,
    passwordsSchema,
} from "./validator";
import {
    APIError,
} from "./api-error";
import {
    IEmail,
    IAppHeader,
    IPasswordReset,
} from "../models/reader";

import {
    accountRepo,
} from "../repository/account";

import {
    entranceMap,
} from "../config/sitemap";

/**
 * Passed as session data in redirect since we do not
 * want to carry too much data in a session.
 */
export interface ITokenApiErrors {
    message?: string; // fallback error message
    invalid?: boolean; // indicates the token is invalid.
}

interface UIForgotPassword extends UIBase {
    input?: ITextInput; // The input box to enter email
    done?: IActionDone; // 
}

// Form data submitted on the resetting password page.
export interface IPwResetFormData {
    password: string;
    confirmPassword: string;
}

interface IResetPwResult extends IFetchResult<boolean> {
    errForm?: IPwResetFormData; // Client validation 
}

interface UIPwReset extends UIBase {
    email: string;
    inputs: Array<ITextInput>;
}

class PwResetViewModel {

    private readonly msgEmailNotFound: string = "该邮箱不存在，请检查您输入的邮箱是否正确";
    private readonly msgTokenInvalid: string = "无法重置密码。您似乎使用了无效的重置密码链接，请重试";
    private readonly msgLetterSent: string = "请检查您的邮件，点击邮件中的“重置密码”按钮修改您的密码。如果几分钟内没有看到邮件，请检查是否被放进了垃圾邮件列表。";
    private readonly msgPwReset: string = "密码已更新";
    private readonly btnBack: string = "返回";
    private readonly btnLogin: string = "登录";

    buildEmailInput(values?: IEmail, errors?: IEmail): ITextInput {
        return {
            label: "",
            id: "email",
            type: "email",
            name: "email",
            value: values ? values.email : "",
            placeholder: "登录FT中文网所用的邮箱",
            required: true,
            maxlength: "64",
            desc: "请输入您的电子邮箱，我们会向该邮箱发送邮件，帮您重置密码",
            error: errors ? errors.email : "",
        }
    }
    
    async validateEmail(input: IEmail): Promise<IFormState<IEmail>> {
        try {
            const result = await validate<IEmail>(input, emailSchema);

            return {
                values: result,
            };

        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as IEmail,
            }
        }
    }

    async requestLetter(
        formData: IEmail, 
        app: IAppHeader
    ): Promise<IUpdateResult<IEmail>> {
        const { values, errors } = await this.validateEmail(formData);

        if (errors) {
            return {
                errForm: errors,
            }
        }

        if (!values) {
            throw new Error("invalid form data to request password reset letter");
        }

        try {
            const ok = await accountRepo.requestPwResetLetter(values, app)

            return {
                success: ok,
            }
        } catch (e) {
            const errResp = new APIError(e);
            if (errResp.notFound) {
                return {
                    errForm: {
                        email: this.msgEmailNotFound,
                    }
                }
            }

            if (errResp.error) {
                const o = errResp.error.toMap();

                return {
                    errForm: {
                        email: o.get("email") || "",
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

    buildEmailUI(
        formData?: IEmail, 
        result?: IUpdateResult<IEmail>,
    ): UIForgotPassword {
        if (formData && formData.email) {
            formData.email = formData.email.trim();
        }

        return {
            errors: result ? result.errApi : undefined,
            input: this.buildEmailInput(
                formData,
                result ? result.errForm : undefined,
            ),
        }
    }

    buildSuccessUI(key: ActionDoneKey): UIForgotPassword {
        switch (key) {
            case "letter_sent":
                return {
                    done: {
                        message: this.msgLetterSent,
                        link: {
                            href: entranceMap.login,
                            text: this.btnBack,
                        }
                    }
                };

            case "password_reset":
                return {
                    done: {
                        message: this.msgPwReset,
                        link: {
                            href: entranceMap.login,
                            text: this.btnLogin,
                        },
                    }
                }
        } 
    }

    async verifyToken(token: string): Promise<IFetchResult<IEmail>> {
        try {
            const result = await accountRepo.verifyPwResetToken(token);

            return {
                success: result,
            };
        } catch (e) {
            const errResp = new APIError(e);

            return {
                errResp,
            }
        }
    }

    /**
     * @description If password reset token is invalid,
     * user will be redirected to the /password-reset
     * page with an alert message.
     * The `errors` object is extracted from `ctx.session.errors` field.
     */
    buildInvalidTokenUI(result: ITokenApiErrors): UIForgotPassword {
        const uiData: UIForgotPassword = {
            input: this.buildEmailInput(),
        }

        if (result.invalid) {
            uiData.alert = {
                message: this.msgTokenInvalid,
            }

            return uiData;
        }

        if (result.message) {
            uiData.errors = {
                message: result.message,
            };

            return uiData;
        }

        return uiData;
    }

    private buildPwInputs(errors?: IPwResetFormData): Array<ITextInput> {
        return [
            {
                label: "密码",
                id: "password",
                type: "password",
                name: "credentials[password]",
                placeholder: "",
                required: true,
                minlength: "8",
                maxlength: "64",
                desc: "",
                error: errors ? errors.password : undefined,
            },
            {
                label: "再次输入确认",
                id: "confirmPassword",
                type: "password",
                name: "credentials[confirmPassword]",
                placeholder: "",
                required: true,
                minlength: "8",
                maxlength: "64",
                desc: "请确保两次输入的密码一致",
                error: errors ? errors.confirmPassword : undefined,
            },
        ];
    }

    async validatePasswords(formData: IPwResetFormData): Promise<IFormState<IPwResetFormData>> {
        try {
            const result = await validate<IPwResetFormData>(formData, passwordsSchema)

            return {
                values: result,
            };
        } catch (e) {
            const ex: ValidationError = e;
            return {
                errors: buildJoiErrors(e) as IPwResetFormData,
            };
        }
    }

    async resetPassword(formData: IPwResetFormData, token: string): Promise<IResetPwResult> {
        const { values, errors } = await this.validatePasswords(formData);

        if (errors) {
            return {
                errForm: errors,
            }
        }

        if (!values) {
            throw new Error("form data missing");
        }

        const pwReset: IPasswordReset = {
            token: token.trim(),
            password: values.password,
        }

        try {
            const ok = await accountRepo.resetPassword(pwReset);

            return {
                success: ok,
            };
        } catch (e) {
            const errResp = new APIError(e);

            if (errResp.error) {
                const o = errResp.error.toMap();
                return {
                    errForm: {
                        password: o.get("password") || "",
                        confirmPassword: "",
                    },
                };
            }

            return {
                errResp,
            };
        }
    }

    buildPwResetUI(
        email: string, 
        result?: IResetPwResult
    ): UIPwReset {
        const uiData: UIPwReset = {
            email,
            inputs: this.buildPwInputs(result 
                ? result.errForm 
                : undefined
            ),
        }

        if (result && result.errResp) {
            const errResp = result.errResp;

            if (errResp.notFound) {
                uiData.alert = {
                    message: this.msgTokenInvalid,
                };

                return uiData;
            }

            uiData.errors = {
                message: errResp.message,
            };
            
            return uiData;
        }

        return uiData;
    }
}

export const pwResetViewModel = new PwResetViewModel();