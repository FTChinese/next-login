import { Account } from "../models/reader";
import { FormPage } from "./form-page";
import { ValidationError } from "@hapi/joi";
import { emailSchema, joiOptions, reduceJoiErrors } from "./validator";
import { accountService } from "../repository/account";
import { APIError } from "../repository/api-response";
import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { TextInputElement } from "../widget/text-input";
import { Button } from "../widget/button";
import { EmailData } from "../models/form-data";

export class UpdateEmailBuilder {
  flashMsg?: string;
  errors: Map<string, string> = new Map();
  account: Account;
  formData?: EmailData;

  constructor (account: Account) {
    this.account = account;
  }

  get updatedAccount(): Account {
    return this.formData
        ? Object.assign(this.account, this.formData)
        : this.account;
  }
  async validate(data: EmailData): Promise<boolean> {
    try {
      const result = await emailSchema.validateAsync(data, joiOptions);

      this.formData = result;
      return true;
    } catch (e) {
      this.errors = reduceJoiErrors(e as ValidationError);

      return false;
    }
  }

  async update(): Promise<boolean> {
    if (!this.formData) {
      throw new Error("invalid form data to change email");
    }

    // noop if email is not actually changed.
    if (this.formData.email === this.account.email) {
      return true;
    }

    try {
      const ok = await accountService.updateEmail(
        this.account.id,
        this.formData,
      );

      return ok;
    } catch (e) {

      const errResp = new APIError(e);

      if (errResp.unprocessable) {
        // error.field: "email"
        // error.code: "missing_field" | "invalid"
        this.errors = errResp.controlErrs;

        return false;
      }

      this.flashMsg = errResp.message;
      return false;
    }
  }

  build(): FormPage {
    const page: FormPage = {
      heading: "更改登录邮箱",
    }

    if (this.flashMsg) {
      page.flash = Flash.danger(this.flashMsg);
    }

    const email = this.formData 
      ? this.formData.email 
      : this.account.email;

    page.form = new Form({
      disabled: false,
      method: "post",
      action: "",
      controls: [
        new FormControl({
          controlType: ControlType.Text,
          field: new TextInputElement({
            id: "name",
            type: "text",
            name: "email",
            value: email,
            maxlength: 11,
          }),
          error: this.errors.get("email"),
        })
      ],
      submitBtn: Button.primary()
        .setName("保存")
        .setDisableWith("正在保存..."),
    });

    return page;
  }
}
