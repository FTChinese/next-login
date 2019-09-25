import {
    validate,
    ValidationError,
} from "@hapi/joi";
import {
    ITextInput,
    UIBase,
} from "./ui";
import {
    loginSchema,
    buildJoiErrors,
} from "./validator";
import {
    parseApiError,
} from "./api-error";
import {
    ICredentials,
    Account,
    IAppHeader,
} from "../models/reader";

import {
    accountRepo,
} from "../repository/account";

import {
    entranceMap,
} from "../config/sitemap";

interface ILoginFormState {
    values?: ICredentials; // The value after sanitation and validation, if errors if null
    errors?: ICredentials; // The error fields with error message.
}

interface ILoginForm {
    inputs: Array<ITextInput>
}

export interface ILoginApiErrors {
    message?: string;
    invalidCredentials?: boolean;
}

interface ILoginResult {
    success?: Account;
    errForm?: ICredentials;
    errApi?: ILoginApiErrors;
}

interface UILogin extends UIBase {
    form: ILoginForm;
    pwResetLink: string;
    signUpLink: string;
    wxLoginLink: string;
    wxIcon: string;
}

class LoginViewModel {
    private readonly msgInvalidCredentials = "邮箱或密码错误";

    buildInputs(values?: ICredentials, errors?: ICredentials): Array<ITextInput> {
        return [
            {
                label: "邮箱",
                id: "email",
                type: "email",
                name: "credentials[email]",
                value: values ? values.email : "",
                placeholder: "电子邮箱",
                maxlength: "64",
                required: true,
                error: errors ? errors.email : "",
            },
            {
                label: "密码",
                id: "password",
                type: "password",
                name: "credentials[password]",
                placeholder: "密码",
                maxlength: "64",
                required: true,
                error: errors ? errors.password : "",
            }
        ];
    }

    async validate(input: ICredentials): Promise<ILoginFormState> {
        try {
            const result = await validate<ICredentials>(input, loginSchema)

            return {
                values: result,
            };
    
        } catch (e) {
            
            const ex: ValidationError = e;
    
            return {
                errors: buildJoiErrors(ex.details) as ICredentials,
            };
        }
    }

    async logIn(formData: ICredentials, app: IAppHeader): Promise<ILoginResult> {
        const { values, errors } = await this.validate(formData);

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
            switch (e.status) {
                case 404:
                case 403:
                    return {
                        errApi: {
                            invalidCredentials: true,
                        },
                    };
    
                default:
                    const errBody = parseApiError(e);
                    if (errBody.error) {
                        const o = errBody.error.toMap();

                        return {
                            errForm: {
                                email: o.get("email") || "",
                                password: o.get("password") || "",
                            }
                        }
                    }
                    return {
                        errApi: {
                            message: errBody.message,
                        }
                    };
            
            }
        }
    }

    buildUI(formData?: ICredentials, result?: ILoginResult): UILogin {
        if (formData && formData.email) {
            formData.email = formData.email.trim();
        }

        const uiData: UILogin = {
            form: {
                inputs: this.buildInputs(
                    formData, 
                    result 
                        ? result.errForm 
                        : undefined,
                ),
            },
            pwResetLink: entranceMap.passwordReset,
            signUpLink: entranceMap.signup,
            wxLoginLink: entranceMap.wxLogin,
            wxIcon: "https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon32_wx_button.png",
        };

        if (result && result.errApi) {
            if (result.errApi.message) {
                uiData.errors = {
                    message: result.errApi.message,
                };
            }

            if (result.errApi.invalidCredentials) {
                uiData.alert = {
                    message: this.msgInvalidCredentials,
                };
            }
        }

        return uiData;
    }
}

export const loginViewModel = new LoginViewModel();
