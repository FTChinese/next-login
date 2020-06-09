import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { entranceMap } from "../config/sitemap";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { TextInputElement } from "../widget/text-input";
import { buildCredentialControls } from "./login-page";
import { Account } from "../models/account";
import { joiOptions, reduceJoiErrors } from "./validator";
import { signUpSchema } from "./validator";
import { ValidationError } from "@hapi/joi";
import { IHeaderApp } from "../models/header";
import { APIError, errMsg } from "../models/api-response";
import { accountService } from "../repository/account";
import { SignUpForm } from "../models/form-data";

export interface SignUpPage {
  flash?: Flash;
  form: Form;
  loginLink: string;
}

export class SignUpBuilder {
  errors: Map<string, string> = new Map();
  flashMsg?: string;
  data: SignUpForm = {
    email: '',
    password: '',
    confirmPassword: ''
  };

  async validate(data: SignUpForm): Promise<boolean> {
    try {
      const result = await signUpSchema.validateAsync(data, joiOptions);

      this.data = result;

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
        this.flashMsg = errMsg.signUp.tooMany;
        return null;
      }

      if (errResp.unprocessable) {
        this.errors = errResp.controlErrs;

        return null;
      }

      this.flashMsg = errResp.message;

      return null;
    }
  }

  build(): SignUpPage {
    const controls = buildCredentialControls(this.data, this.errors);
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
          placeholder: "再次输入密码",
          maxlength: 32,
          required: true,
        }),
        error: this.errors.get("confirmPassword"),
      }),
    );

    return {
      flash: this.flashMsg ? Flash.danger(this.flashMsg) : undefined,
      form: new Form({
        disabled: false,
        method: "post",
        action: "",
        controls: controls,
        submitBtn: Button.primary()
          .setBlock()
          .setName("注册")
          .setDisableWith("正在注册...")
      }),
      loginLink: entranceMap.login,
    };
  }
}


