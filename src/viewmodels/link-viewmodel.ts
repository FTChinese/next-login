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
    IFetchResult,
    UISingleInput,
    UIMultiInputs,
} from "./ui";

import {
    emailSchema,
    loginSchema,
    signUpSchema,
    buildJoiErrors,
} from "./validator";

import {
    Account,
    IEmail,
    ICredentials,
    IAppHeader,
} from "../models/reader";

import {
    accountRepo,
} from "../repository/account";
import { 
    APIError 
} from "./api-error";
import { response } from "express";

const log = debug("user:link-viewmodel");

interface IExistsResult extends IFetchResult<boolean> {
    errForm?: IEmail;
}

interface ILoginResult extends IFetchResult<Account> {
    errForm?: ICredentials;
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

    async checkEmail(formData: IEmail): Promise<IExistsResult> {
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
            }
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

    buildEmailUI(formData?: IEmail, result?: IExistsResult): UISingleInput {
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

    async logIn(formData: ICredentials, app: IAppHeader): Promise<ILoginResult> {
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
            const account = await accountRepo.login(values, app);

            return {
                success: account,
            }
        } catch (e) {
            const errResp = new APIError(e);

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

    buildLoginUI(formData?: ICredentials, result?: ILoginResult): UIMultiInputs {
        if (formData && formData.email) {
            formData.email = formData.email.trim();
        }

        const { errForm, errResp} = result || {};

        const uiData: UIMultiInputs = {
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
        };

        if (errResp) {
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
}

export const linkViewModel = new LinkViewModel();
