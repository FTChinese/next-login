import { validate, ValidationError } from "@hapi/joi";
import { Flash } from "../widget/flash";
import { FormBuilder } from "../widget/form";
import { Button } from "../widget/button";
import { entranceMap } from "../config/sitemap";
import { loginSchema, joiOptions } from "../viewmodels/validator";
import { accountRepo } from "../repository/account";
import { IHeaderApp } from "../models/header";
import { Account } from "../models/reader";
import { APIError } from "../viewmodels/api-response";

export interface Credentials {
    email: string;
    password: string;
}

export class CredentialBuilder implements Credentials {
    email: string;
    password: string;
    errors: Map<string, string> = new Map();
    readonly data: Credentials;

    constructor(c: Credentials) {
        this.email = c.email;
        this.password = c.password;
        this.data = c;
    }

    async validate(): Promise<boolean> {
        try {
            const result = await validate<Credentials>(this.data, loginSchema, joiOptions);

            Object.assign(this.data, result);

            return true;
        } catch (e) {
            const ex: ValidationError = e;

            for (const item of ex.details) {
                const key = item.path.join("_");
                this.errors.set(key, item.message)
            }
            return false;
        }
    }

    login(app: IHeaderApp): Promise<Account> {
        return accountRepo.authenticate(this.data, app);
    }

    static default(): CredentialBuilder {
        return new CredentialBuilder({
            email: "",
            password: "",
        });
    }
}

const msgInvalidCredentials = "邮箱或密码错误";

export class LoginPage {

    flash?: Flash | undefined;
    form: FormBuilder;
    pwResetLink: string;
    signUpLink: string;
    wxLoginLink: string;
    wxIcon: string;

    constructor(
        c: CredentialBuilder
    ) {
        this.flash = undefined;
        this.form = new FormBuilder({
            disabled: false,
            method: "post",
            action: "",
            controls: [
                {
                    label: "邮箱",
                    attrs: {
                        id: "email",
                        type: "email" as const,
                        name: "credentials[email]",
                        value: c.email,
                        placeholder: "电子邮箱",
                        maxlength: 32,
                        required: true,
                    },
                    error: c.errors ? c.errors.get("email") : undefined,
                },
                {
                    label: "密码",
                    attrs: {
                        id: "password",
                        type: "password" as const,
                        name: "credentials[password]",
                        placeholder: "密码",
                        maxlength: 64,
                        required: true,
                    },
                    error: c.errors ? c.errors.get("password") : undefined,
                }
            ],
            submitBtn: Button
                .primary()
                .setBlock()
                .setName("登录")
                .setDisableWith("正在登录..."),
        });
        this.pwResetLink = entranceMap.passwordReset;
        this.signUpLink = entranceMap.signup;
        this.wxIcon = "https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon32_wx_button.png";
        this.wxLoginLink = entranceMap.wxLogin
    }

    withErrResp(errResp: APIError): LoginPage {
        if (errResp.notFound || errResp.forbidden) {
            this.flash = Flash.danger(msgInvalidCredentials);
            return this;
        }

        if (errResp.unprocessable) {
            this.form.withErrors(errResp.unprocessable.toMap());
            return this;
        }

        this.flash = Flash.danger(errResp.message);

        return this;
    }
}


