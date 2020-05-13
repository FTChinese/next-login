import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { entranceMap } from "../config/sitemap";
import { Button } from "../widget/button";
import { TextInputElement } from "../widget/text-input";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { IPasswordsFormData } from "./account-page";
import { ValidationError } from "@hapi/joi";
import { passwordUpdatingSchema, joiOptions, reduceJoiErrors } from "./validator";
import { accountService } from "../repository/account";
import { APIError } from "../repository/api-response";
import { Account } from "../models/reader";

interface PasswordPage {
  heading: string;
  flash?: Flash;
  form: Form;
  pwResetLink: string;
}

export class UpdatePasswordBuilder {
  flashMsg?: string;
  errors: Map<string, string> = new Map();
  account: Account;
  passwords?: IPasswordsFormData;

  constructor (account: Account) {
    this.account = account;
  }

  build(): PasswordPage {
    return {
      heading: "更改密码",
      flash: this.flashMsg ? Flash.danger(this.flashMsg) : undefined,
      form: new Form({
        disabled: false,
        action: "",
        method: "post",
        controls: [
          new FormControl({
            label: {
              text: "当前密码",
            },
            controlType: ControlType.Text,
            field: new TextInputElement({
              id: "oldPassword",
              type: "password",
              name: "oldPassword",
              required: true,
            }),
            error: this.errors.get("oldPassword"),
          }),
          new FormControl({
            label: {
              text: "新密码",
            },
            controlType: ControlType.Text,
            field: new TextInputElement({
              id: "password",
              type: "password",
              name: "password",
              required: true,
              minlength: 8,
              maxlength: 32,
            }),
            desc: "最少8个字符",
            error: this.errors.get("password"),
          }),
          new FormControl({
            label: {
              text: "再次输入新密码",
            },
            controlType: ControlType.Text,
            field: new TextInputElement({
              id: "confirmPassword",
              type: "password",
              name: "confirmPassword",
              placeholder: "",
              required: true,
              minlength: 8,
              maxlength: 32,
            }),
            desc: "两次输入的新密码须一致",
            error: this.errors.get("password"),
          }),
        ],
        submitBtn: Button.primary()
          .setName("保存密码")
          .setDisableWith("保存...")
      }),
      pwResetLink: entranceMap.passwordReset,
    }
  }

  async validate(data: IPasswordsFormData): Promise<boolean> {
    try {
      const result = await passwordUpdatingSchema.validateAsync(data, joiOptions);

      this.passwords = result;

      return true;
    } catch (e) {
      this.errors = reduceJoiErrors(e as ValidationError);
      return false;
    }
  }

  async update(): Promise<boolean> {

    if (!this.passwords) {
      throw new Error("invalid form data to change password");
    }

    try {
      const ok = await accountService.updatePassword(
        this.account.id,
        {
          oldPassword: this.passwords.oldPassword,
          newPassword: this.passwords.password,
        },
      );

      return ok;
    } catch (e) {

      const errResp = new APIError(e);

      if (errResp.forbidden) {
        this.flashMsg = "当前密码错误";
        return false;
      }

      if (errResp.unprocessable) {
        // field: "oldPassword" | "newPassword"
        // code: "missing_fied" | "invalid"
        // This generates 
        this.errors = errResp.unprocessable.toMap();

        return false;
      }

      this.flashMsg = errResp.message;
      return false;
    }
  }
}
