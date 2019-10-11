import {
    validate,
    ValidationError,
} from "@hapi/joi";
import {
    ITextInput,
    UIMultiInputs,
} from "./ui";
import {
    loginSchema,
    buildJoiErrors,
    IFormState,
} from "./validator";
import {
    APIError,
    IFetchResult,
} from "./api-response";
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

interface ILoginResult extends IFetchResult<Account> {
    errForm?: ICredentials;
}

interface UILogin extends UIMultiInputs {
    inputs: Array<ITextInput>;
    pwResetLink: string;
    signUpLink: string;
    wxLoginLink: string;
    wxIcon: string;
}

class LoginViewModel {
    private readonly msgInvalidCredentials = "邮箱或密码错误";

    async validate(input: ICredentials): Promise<IFormState<ICredentials>> {
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
            const userId = await accountRepo.authenticate(values, app);


            const account = await accountRepo.fetchFtcAccount(userId);

            return {
                success: account,
            }
        } catch (e) {
            const errResp = new APIError(e);

            if (errResp.error) {
                const o = errResp.error.toMap();

                return {
                    errForm: {
                        email: o.get(errResp.error.field) || "",
                        password: o.get(errResp.error.field) || "",
                    }
                }
            }

            return {
                errResp,
            }
        }
    }

    buildUI(formData?: ICredentials, result?: ILoginResult): UILogin {
        if (formData && formData.email) {
            formData.email = formData.email.trim();
        }

        const { errForm, errResp } = result || {};
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
            signUpLink: entranceMap.signup,
            wxLoginLink: entranceMap.wxLogin,
            wxIcon: "https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon32_wx_button.png",
        };

        if (errResp) {

            if (errResp.notFound || errResp.forbidden) {
                uiData.alert = {
                    message: this.msgInvalidCredentials,
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

export const loginViewModel = new LoginViewModel();
