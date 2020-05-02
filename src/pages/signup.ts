import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { entranceMap } from "../config/sitemap";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { TextInputElement } from "../widget/text-input";
import { buildCredentialControls } from "./login";
import { Account, Credentials } from "../models/reader";
import { joiOptions, reduceJoiErrors } from "./validator";
import { signUpSchema } from "./validator";
import { validate, ValidationError } from "@hapi/joi";
import { IHeaderApp } from "../models/header";
import { APIError } from "../repository/api-response";
import { accountService } from "../repository/account";

export interface SignUpData extends Credentials {
  confirmPassword: string;
}

const msgTooManyRequests: string = "您创建账号过于频繁，请稍后再试";

export class SignUpBuilder {
  errors: Map<string, string> = new Map();
  flashMsg?: string;
  readonly data: SignUpData;

  constructor(data: SignUpData) {
    this.data = data;
  }

  async validate(): Promise<boolean> {
    try {
      const result = await validate<SignUpData>(this.data, signUpSchema, joiOptions);

      Object.assign(this.data, result);

      return true;
    } catch (e) {
      this.errors = reduceJoiErrors(e as ValidationError);
      return false;
    }
  }

  async create(app: IHeaderApp): Promise<Account | null> {
    try {
      const userId = await accountService.createReader({
        email: this.data.email,
        password: this.data.password,
      }, app);

      const account = await accountService.fetchFtcAccount(userId);

      return account;
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.status == 429) {
        this.flashMsg = msgTooManyRequests;
        return null;
      }

      if (errResp.unprocessable) {
        this.errors = errResp.unprocessable.toMap();

        return null;
      }

      this.flashMsg = errResp.message;

      return null;
    }
  }

  static default(): SignUpBuilder {
    return new SignUpBuilder({
      email: "",
      password: "",
      confirmPassword: "",
    });
  }
}

export class SignUpPage {
  flash?: Flash;
  form: Form;
  loginLink: string;

  constructor(s: SignUpBuilder) {
    if (s.flashMsg) {
      this.flash = Flash.danger(s.flashMsg);
    }

    const controls = buildCredentialControls(s.data, s.errors);
    controls[0].setDesc("用于登录FT中文网");
    controls[1].setDesc("最少8个字符");
    controls.push(
      new FormControl({
        label: {
          text: "确认密码"
        },
        controlType: ControlType.Text,
        field: new TextInputElement({
          id: "confirmPassword",
          type: "password",
          name: "credentials[confirmPassword]",
          placeholder: "再次输入新密码",
          maxlength: 32,
          required: true,
        }),
        error: s.errors.get("confirmPassword"),
      }),
    );

    this.form = new Form({
      disabled: false,
      method: "post",
      action: "",
      controls: controls,
      submitBtn: Button.primary()
        .setBlock()
        .setName("注册")
        .setDisableWith("正在注册...")
    });
    this.loginLink = entranceMap.login;
  }
}
