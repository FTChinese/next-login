import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { ValidationError } from "@hapi/joi";
import { passwordsSchema, reduceJoiErrors } from "./validator";
import { joiOptions } from "./validator";
import { FormControl } from "../widget/form-control";
import { Button } from "../widget/button";
import { TextInputElement } from "../widget/text-input";
import { ControlType } from "../widget/widget";
import { accountService } from "../repository/account";
import { APIError } from "../models/api-response";
import { KeyDone } from "./request-pw-reset-page";
import { FormPage } from "./base-page";
import { PasswordResetForm } from "../models/form-data";

export class ResetPwBuilder {

  private errors: Map<string, string> = new Map(); // Hold validator error for each form field. Key is field's name attribute.
  private flashMsg?: string; // Hold message for API non-422 error.
  private formData: PasswordResetForm = {
    password: '',
    confirmPassword: ''
  };

  email: string;
  // False only if error occurred upon verify token.
  private showForm = true;

  // Verify if a token is valid.
  // 3 possible states:
  // 1. Token is valid and api returns the email associated with it.
  // 2. Token is not found thus it is invalid, perform rediretion.
  // 3. Other errors, and only show a flash message.
  async verifyToken(token: string): Promise<KeyDone | null> {
    try {
      const result = await accountService.verifyPwResetToken(token);
      this.email = result.email;

      return null;
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.notFound) {
        return "invalid_token";
      }

      this.showForm = false;
      this.flashMsg = errResp.message;

      return null;
    }
  }

  async validate(data: PasswordResetForm): Promise<boolean> {
    try {
      const result = await passwordsSchema.validateAsync(data, joiOptions)

      this.formData = result

      return true;
    } catch (e) {
      this.errors = reduceJoiErrors(e as ValidationError);
      return false;
    }
  }

  async resetPassword(token: string): Promise<boolean> {
    try {
      const ok = await accountService.resetPassword({
        password: this.formData.password,
        token: token,
      });

      return ok;
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.unprocessable) {
        this.errors = errResp.controlErrs;
        return false;
      }

      this.flashMsg = errResp.message;
      return false;
    }
  }

  build(): FormPage {
    return {
      pageTitle: "重置密码",
      heading: this.email 
        ? `重置 ${this.email} 的密码` 
        : "更改密码",
      flash: this.flashMsg ? Flash.danger(this.flashMsg) : undefined,
      form: this.showForm ? new Form({
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
            desc: "长度最少8位",
            error: this.errors.get("password"),
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
            error: this.errors.get("confirmPassword"),
          })
        ],
        submitBtn: Button.primary()
          .setBlock()
          .setName("重置密码")
          .setDisableWith("保存新密码..."),
      }) : undefined,
    }
  }
}

