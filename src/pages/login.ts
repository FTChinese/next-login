import { validate, ValidationError } from "@hapi/joi";
import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { TextInputElement } from "../widget/text-input";
import { entranceMap } from "../config/sitemap";
import { loginSchema, joiOptions, reduceJoiErrors } from "./validator";
import { accountService } from "../repository/account";
import { IHeaderApp } from "../models/header";
import { Account, Credentials } from "../models/reader";
import { APIError } from "../repository/api-response";
import { CheckboxInputElement } from "../widget/radio-input";

const msgInvalidCredentials = "邮箱或密码错误";

export interface LoginPage {
  flash?: Flash | undefined; // Only exists when API returns a non-validation error.
  form: Form;
  pwResetLink: string;
  signUpLink: string;
  wxLoginLink: string;
  wxIcon: string;
}

export class CredentialBuilder {

  errors: Map<string, string> = new Map(); // Hold validator error for each form field. Key is field's name attribute.
  flashMsg?: string; // Hold message for API non-422 error.
  formData: Credentials = {
    email: '',
    password: ''
  };

  async validate(c: Credentials): Promise<boolean> {
    try {
      const result = await validate<Credentials>(
        c,
        loginSchema,
        joiOptions
      );

      this.formData = result;

      return true;
    } catch (e) {
      this.errors = reduceJoiErrors(e as ValidationError);
      return false;
    }
  }

  async login(app: IHeaderApp): Promise<Account | null> {
    if (!this.formData) {
      throw new Error('No form data submitted!');
    }
    try {
      const account = await accountService.authenticate(this.formData, app);

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

  build(): LoginPage {

    const controls = buildCredentialControls(this.formData, this.errors);
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
    
    return {
      flash: this.flashMsg ? Flash.danger(this.flashMsg) : undefined,
      form: new Form({
        disabled: false,
        method: "post",
        action: "",
        controls,
        submitBtn: Button.primary()
          .setBlock()
          .setName("登录")
          .setDisableWith("正在登录..."),
      }),
      pwResetLink: entranceMap.passwordReset,
      signUpLink: entranceMap.signup,
      wxIcon:
      "https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon32_wx_button.png",
      wxLoginLink: entranceMap.wxLogin
    }; 
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


