import { ValidationError } from "@hapi/joi";
import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { TextInputElement } from "../widget/text-input";
import { entranceMap } from "../config/sitemap";
import { loginSchema, joiOptions, reduceJoiErrors, textLen } from "./validator";
import { accountService } from "../repository/account";
import { HeaderApp } from "../models/header";
import { Account } from "../models/account";
import { APIError, errMsg } from "../models/api-response";
import { CheckboxInputElement } from "../widget/radio-input";
import { Credentials } from "../models/form-data";
import { FormPage } from "./base-page";
import { Image, Link } from "../widget/link";

export type LoginPage = FormPage & {
  entranceNav: Link[];
  wxLogin?: Image;
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
      const result = await loginSchema.validateAsync(
        c,
        joiOptions
      );

      this.formData = result;

      return true;
    } catch (e) {
      this.errors = reduceJoiErrors(e as ValidationError);
      return false;
    }
  }

  async login(app: HeaderApp): Promise<Account | null> {
    if (!this.formData) {
      throw new Error('No form data submitted!');
    }
    try {
      const account = await accountService.authenticate(this.formData, app);

      return account;
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.notFound || errResp.forbidden) {
        this.flashMsg = errMsg.credentials.notFound;
        return null;
      }
  
      if (errResp.unprocessable) {
        this.errors = errResp.controlErrs;
        return null
      }

      this.flashMsg = errResp.message;

      return null;
    }
  }

  /**
   * 
   * @param isMobile - determines whether the Wechat login button is visible.
   * It is not visible on mobile devices.
   */
  build(isMobile: boolean): LoginPage {

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
      pageTitle: "登录",
      heading: "登录FT中文网",
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
      entranceNav: [
        {
          text: "忘记密码?",
          href: entranceMap.passwordReset,
        },
        {
          text: "新建账号",
          href: entranceMap.signup
        }
      ],
      wxLogin: isMobile ? undefined : {
        alt: "微信登录",
        src: "https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon32_wx_button.png",
        href: entranceMap.wxLogin
      },
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
        maxlength: textLen.email.max,
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
        maxlength: textLen.password.max,
        required: true,
      }),
      error: errors.get("password"),
    }),
  ];
}


