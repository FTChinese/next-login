import {
    validate,
    ValidationError,
} from "@hapi/joi";
import {
    TextInput,
    UIApiErrorBase,
} from "./ui";
import {
    buildJoiErrors,
    signUpSchema,
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

export interface ISignUpFormData extends ICredentials {
    confirmPassword: string;
}

interface ISignUpFormState {
    values?: ISignUpFormData,
    errors?: ISignUpFormData
}

interface ISignUpForm {
    inputs: Array<TextInput>;
}

interface ISignUpResult {
    success?: Account,
    errForm?: ISignUpFormData,
    errApi?: UIApiErrorBase,
}

interface UISignUp {
    errors?: UIApiErrorBase,
    form: ISignUpForm;
    loginLink: string;
}

class SignUpViewModel {

    private readonly tooManyRequests: string = "您创建账号过于频繁，请稍后再试";

    buildInputs(values?: ISignUpFormData, errors?: ISignUpFormData): Array<TextInput> {
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

    async validate(input: ISignUpFormData): Promise<ISignUpFormState> {
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
            switch (e.status) {
                case 429:
                    return {
                        errApi: {
                            message: this.tooManyRequests,
                        }
                    };

                default:
                    const errBody = parseApiError(e);
                    if (errBody.error) {
                        const o = errBody.error.toMap();

                        return {
                            errForm: {
                                email: o.get("email") || "",
                                password: o.get("password") || "",
                                confirmPassword: o.get("confirmPassword") || "",
                            }
                        };
                    }

                    return {
                        errApi: {
                            message: errBody.message,
                        },
                    };
            }
        }
    }

    buildUI(formData?: ISignUpFormData, result?: ISignUpResult): UISignUp {
        if (formData && formData.email) {
            formData.email = formData.email.trim();
        }

        return {
            errors: result ? result.errApi : undefined,
            form: {
                inputs: this.buildInputs(
                    formData,
                    result ? result.errForm : undefined
                )
            },
            loginLink: entranceMap.login,
        }
    }
}

export const signUpViewModel = new SignUpViewModel();
