import {
    validate,
    ValidationError,
} from "@hapi/joi";
import {
    ITextInput, IErrors, UIBase, IFormState, IFetchResult,
} from "./ui";
import {
    buildJoiErrors,
    signUpSchema,
} from "./validator";
import {
    APIError,
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

export interface ISignUpFormData extends ICredentials {
    confirmPassword: string;
}

interface ISignUpResult extends IFetchResult<Account> {
    errForm?: ISignUpFormData,
}

interface UISignUp extends UIBase {
    inputs: Array<ITextInput>;
    loginLink: string;
}

class SignUpViewModel {

    private readonly msgTooManyRequests: string = "您创建账号过于频繁，请稍后再试";

    buildInputs(values?: ISignUpFormData, errors?: ISignUpFormData): Array<ITextInput> {
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
                desc: "用于登录FT中文网",
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
                desc: "最少8个字符",
                error: errors ? errors.password : "",
            },
            {
                label: "确认密码",
                id: "confirmPassword",
                type: "password",
                name: "credentials[confirmPassword]",
                placeholder: "再次输入新密码",
                maxlength: "64",
                required: true,
                error: errors ? errors.confirmPassword : "",
            },
        ];
    }

    async validate(input: ISignUpFormData): Promise<IFormState<ISignUpFormData>> {
        try {
            const result = await validate<ISignUpFormData>(input, signUpSchema);

            return {
                values: result,
            }
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as ISignUpFormData,
            };
        }
    }

    async signUp(formData: ISignUpFormData, app: IAppHeader): Promise<ISignUpResult> {
        const { values, errors } = await this.validate(formData);

        if (errors) {
            return {
                errForm: errors,
            }
        }

        if (!values) {
            throw new Error("invalid form data to sign up");
        }

        try {
            const account = await accountRepo.signUp(values, app);

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
                        confirmPassword: o.get("confirmPassword") || "",
                    }
                };
            }

            return {
                errResp,
            };
        }
    }

    buildUI(
        formData?: ISignUpFormData, 
        result?: ISignUpResult
    ): UISignUp {
        if (formData && formData.email) {
            formData.email = formData.email.trim();
        }

        const uiData: UISignUp = {
            inputs: this.buildInputs(
                formData,
                result ? result.errForm : undefined
            ),
            loginLink: entranceMap.login,
        };

        if (result && result.errResp) {
            const errResp = result.errResp;

            if (errResp.status == 429) {
                uiData.alert = {
                    message: this.msgTooManyRequests,
                };

                return uiData
            }

            uiData.errors = {
                message: errResp.message,
            };

            return uiData;
        }

        return uiData;
    }
}

export const signUpViewModel = new SignUpViewModel();
