import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { DataBuilder } from "./data-builder";
import { validate, ValidationError } from "@hapi/joi";
import { passwordsSchema } from "./validator";
import { joiOptions } from "./validator";
import { FormControl } from "../widget/form-control";
import { Button } from "../widget/button";
import { TextInputElement } from "../widget/text-input";
import { ControlType } from "../widget/widget";
import { accountRepo } from "../repository/account";
import { APIError } from "../viewmodels/api-response";

export interface PwResetData {
  password: string;
  confirmPassword: string;
}

export class ResetPwBuilder extends DataBuilder<PwResetData> {

  email: string;

  constructor(data: PwResetData) {
    super(data);
  }

  async verifyToken(token: string): Promise<APIError | null> {
    try {
      const result = await accountRepo.verifyPwResetToken(token);
      this.email = result.email;

      return null;
    } catch (e) {
      this.flashMsg = e.message;
      return new APIError(e);
    }
  }

  async validate(): Promise<boolean> {
    try {
      const result = await validate<PwResetData>(this.data, passwordsSchema, joiOptions)

      Object.assign(this.data, result);

      return true;
    } catch (e) {
      this.reduceJoiErrors(e as ValidationError);
      return false;
    }
  }

  async resetPassword(token: string): Promise<boolean> {
    try {
      const ok = await accountRepo.resetPassword({
        password: this.data.password,
        token: token,
      });

      return ok;
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.unprocessable) {
        this.errors = errResp.unprocessable.toMap();
        return false;
      }

      this.flashMsg = errResp.message;
      return false;
    }
  }

  static default(): ResetPwBuilder {
    return new ResetPwBuilder({
      password: "",
      confirmPassword: "",
    });
  }
}

export class ResetPasswordPage {
  heading: string;
  flash?: Flash;
  form: Form;

  constructor(b: ResetPwBuilder) {
    this.heading = `更改 ${b.email} 的密码`
    if (b.flashMsg) {
      this.flash = Flash.danger(b.flashMsg);
    }

    this.form = new Form({
      disabled: false,
      method: "post",
      action: "",
      controls: [
        new FormControl({
          label: {
            text: "密码"
          },
          controlType: ControlType.Text,
          field: new TextInputElement({
            id: "password",
            type: "password",
            name: "credentials[password]",
            required: true,
            minlength: 8,
            maxlength: 64,
          }),
          error: b.errors.get("password"),
        }),
        new FormControl({
          label: {
            text: "再次输入确认"
          },
          controlType: ControlType.Text,
          field: new TextInputElement({
            id: "confirmPassword",
            type: "password",
            name: "credentials[confirmPassword]",
            required: true,
            minlength: 8,
            maxlength: 64,
          }),
          desc: "请确保两次输入的密码一致",
          error: b.errors.get("confirmPassword"),
        })
      ],
      submitBtn: Button.primary()
        .setBlock()
        .setName("重置密码")
        .setDisableWith("保存新密码..."),
    });
  }
}
