import { validate, ValidationError } from "@hapi/joi";
import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { TextInputElement } from "../widget/text-input";
import { entranceMap } from "../config/sitemap";
import { loginSchema, joiOptions } from "./validator";
import { accountRepo } from "../repository/account";
import { IHeaderApp } from "../models/header";
import { Account, Credentials } from "../models/reader";
import { APIError } from "../viewmodels/api-response";
import { DataBuilder } from "./data-builder";
import { CheckboxInputElement } from "../widget/radio-input";

const msgInvalidCredentials = "邮箱或密码错误";

export class CredentialBuilder extends DataBuilder<Credentials> {

  constructor(c: Credentials) {
    super(c);
  }

  async validate(): Promise<boolean> {
    try {
      const result = await validate<Credentials>(
        this.data,
        loginSchema,
        joiOptions
      );

      Object.assign(this.data, result);

      return true;
    } catch (e) {
      this.reduceJoiErrors(e as ValidationError);
      return false;
    }
  }

  async login(app: IHeaderApp): Promise<Account | null> {
    try {
      const account = await accountRepo.authenticate(this.data, app);

      return account;
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.notFound || errResp.forbidden) {
        this.flashMsg = msgInvalidCredentials;
        return null;
      }
  
      if (errResp.unprocessable) {
        this.errors = errResp.unprocessable.toMap();
        return null
      }

      this.flashMsg = errResp.message;

      return null;
    }
  }

  static default(): CredentialBuilder {
    return new CredentialBuilder({
      email: "",
      password: "",
    });
  }
}

export function buildCredentialControls(data: Credentials, errors: Map<string, string>): FormControl[] {
  return [
    new FormControl({
      label: {
        text: "邮箱",
      },
      controlType: ControlType.Text,
      field: new TextInputElement({
        id: "email",
        type: "email",
        name: "credentials[email]",
        value: data.email,
        placeholder: "电子邮箱",
        maxlength: 32,
        required: true,
      }),
      error: errors.get("email"),
    }),
    new FormControl({
      label: {
        text: "密码",
      },
      controlType: ControlType.Text,
      field: new TextInputElement({
        id: "password",
        type: "password",
        name: "credentials[password]",
        placeholder: "密码",
        maxlength: 32,
        required: true,
      }),
      error: errors.get("password"),
    }),
  ];
}

export class LoginPage {
  flash?: Flash | undefined; // Only exists when API returns a non-validation error.
  form: Form;
  pwResetLink: string;
  signUpLink: string;
  wxLoginLink: string;
  wxIcon: string;

  constructor(c: CredentialBuilder) {
    if (c.flashMsg) {
      this.flash = Flash.danger(c.flashMsg);
    }

    const controls = buildCredentialControls(c.data, c.errors);
    controls.push(
      new FormControl({
        label: {
          text: "记住我",
          suffix: true,
        },
        controlType: ControlType.Checkbox,
        field: new CheckboxInputElement({
          id: "rememberMe",
          name: "rememberMe",
          checked: true,
        }) 
      }),
    );
    
    this.form = new Form({
      disabled: false,
      method: "post",
      action: "",
      controls,
      submitBtn: Button.primary()
        .setBlock()
        .setName("登录")
        .setDisableWith("正在登录..."),
    });
    this.pwResetLink = entranceMap.passwordReset;
    this.signUpLink = entranceMap.signup;
    this.wxIcon =
      "https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon32_wx_button.png";
    this.wxLoginLink = entranceMap.wxLogin;
  }
}
