import {
    validate,
    ValidationError,
} from "@hapi/joi";
import {
    ITextInput,
    IActionDone,
    UIMultiInputs,
    UIBase,
} from "./ui";
import {
    buildJoiErrors,
    emailSchema,
    passwordsSchema,
    IFormState,
} from "./validator";
import {
    APIError,
    IFetchResult,
} from "./api-response";
import {
    IEmail,
    IPasswordReset,
} from "../models/reader";
import {
    IHeaderApp,
} from "../models/header";
import {
    accountRepo,
} from "../repository/account";

import {
    entranceMap,
} from "../config/sitemap";
import { KeyPwReset, getMsgReset } from "./redirection";

/**
 * Passed as session data in redirect since we do not
 * want to carry too much data in a session.
 */
export interface ITokenApiErrors {
    message?: string; // fallback error message
    invalid?: boolean; // indicates the token is invalid.
}

// For this UI, `alert` is used to show messages that
// password token is invalid.
// We are reusing this UI in cases:
// 1. Show the email input box;
// 2. Re-display input box in case email is invalid;
// 3. Password reset letter is sent via redirection;
// 4. Password reset link is invalid via redirection;
interface UIForgotPassword extends UIBase {
    input?: ITextInput; // The input box to enter email
    done?: IActionDone; // Show success message if password reset letter is sent, or password is reset.
}

interface ILetterResult extends IFetchResult<boolean> {
    formState?: IFormState<IEmail>;
}

// Form data submitted on the resetting password page.
export interface IPwResetFormData {
    password: string;
    confirmPassword: string;
}

interface IResetPwResult extends IFetchResult<boolean> {
    errForm?: IPwResetFormData; // Client validation 
}

class PwResetViewModel {

    private readonly msgEmailNotFound: string = "该邮箱不存在，请检查您输入的邮箱是否正确";
    private readonly btnBack: string = "返回";
    private readonly btnLogin: string = "登录";
    
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

    async requestLetter(formData: IEmail, app: IHeaderApp): Promise<ILetterResult> {
        const { values, errors } = await this.validateEmail(formData);

        if (errors) {
            return {
                formState: {
                    values: formData,
                    errors,
                },
            };
        }

        if (!values) {
            throw new Error("invalid form data to request password reset letter");
        }

        try {
            const ok = await accountRepo.requestPwResetLetter(values, app)

            return {
                formState: {
                    values,
                },
                success: ok,
            }
        } catch (e) {
            const errResp = new APIError(e);

            if (errResp.notFound) {
                return {
                    formState: {
                        errors: {
                            email: this.msgEmailNotFound,
                        },
                    },
                };
            }

            if (errResp.error) {
                const o = errResp.error.toMap();

                return {
                    formState: {
                        errors: {
                            email: o.get(errResp.error.field) || ""
                        },
                    },
                };
            }
            return {
                errResp,
            };
        }
    }

    private buildEmailInput(formState?: IFormState<IEmail>): ITextInput {
        const { values, errors } = formState || {};
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

    private buildRedirectedUI(key: KeyPwReset): UIForgotPassword {
        const msg = getMsgReset(key);

        switch (key) {
            case "letter_sent":
                return {
                    done: {
                        message: msg,
                        link: {
                            href: entranceMap.login,
                            text: this.btnBack,
                        }
                    }
                };

            case "pw_reset":
                return {
                    done: {
                        message: msg,
                        link: {
                            href: entranceMap.login,
                            text: this.btnLogin,
                        },
                    }
                };
            
            case "invalid_token":
                return {
                    alert: {
                        message: msg,
                    },
                    input: this.buildEmailInput(),
                };
        } 
    }

    buildEmailUI(
        result?: ILetterResult,
        key?: KeyPwReset,
    ): UIForgotPassword {
        
        if (key) {
            return this.buildRedirectedUI(key);
        }

        const { formState, errResp } = result || {};
        return {
            errors: errResp ? {
                message: errResp.message
            } : undefined,
            input: this.buildEmailInput(formState),
        };
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

    async validatePasswords(formData: IPwResetFormData): Promise<IFormState<IPwResetFormData>> {
        try {
            const result = await validate<IPwResetFormData>(formData, passwordsSchema)

            return {
                values: result,
            };
        } catch (e) {
            const ex: ValidationError = e;
            return {
                errors: buildJoiErrors(ex.details) as IPwResetFormData,
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
                // API only returns error message for `password` field.
                return {
                    errForm: {
                        password: o.get(errResp.error.field) || "",
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
    ): UIMultiInputs {

        const { errForm, errResp } = result || {};

        return {
            errors: errResp ? {
                message: errResp.message,
            } : undefined,
            heading: email ? email : undefined,
            inputs: [
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
                    error: errForm ? errForm.password : undefined,
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
                    error: errForm ? errForm.confirmPassword : undefined,
                },
            ],
        };
    }
}

export const pwResetViewModel = new PwResetViewModel();
