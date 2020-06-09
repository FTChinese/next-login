import { Profile, Account } from "../models/account";
import { profileService } from "../repository/profile";
import { APIError } from "../models/api-response";
import { joiOptions, reduceJoiErrors, mobileSchema, textLen } from "./validator";
import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { TextInputElement } from "../widget/text-input";
import { ControlType } from "../widget/widget";
import { FormPage } from "./form-page";
import { MobileForm } from "../models/form-data";

export class MobileBuilder {
  flashMsg?: string;
  errors: Map<string, string> = new Map();
  profile?: Profile;
  formData?: MobileForm;

  get mobileNumber(): string {
    if (this.formData) {
      return this.formData.mobile;
    }

    if (this.profile) {
      return this.profile.mobile || '';
    }

    return '';
  }

  async fetchProfile(account: Account): Promise<boolean> {
    try {
      const p = await profileService.fetchProfile(account.id);

      this.profile = p;

      return true;
    } catch (e) {
      const errResp = new APIError(e);
      if (errResp.notFound) {
        this.flashMsg = "未找到数据，请稍后再试";
        return false;
      }

      this.flashMsg = errResp.message;
      return false;
    }
  }

  async validate(data: MobileForm): Promise<boolean> {
    try {
      const result = await mobileSchema.validateAsync(data, joiOptions);

      this.formData = result;

      return true;
    } catch (e) {

      this.errors = reduceJoiErrors(e)

      return false;
    }
  }

  async update(account: Account): Promise<boolean> {
    if (!this.formData) {
      throw new Error("mobile number does not exist");
    }

    try {
      const ok = await profileService.updateMobile(account.id, this.formData);

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
      heading: "手机号码",
      flash: this.flashMsg
        ? Flash.danger(this.flashMsg)
        : undefined,
      form: new Form({
        disabled: false,
        method: "post",
        action: "",
        controls: [
          new FormControl({
            controlType: ControlType.Text,
            field: new TextInputElement({
              id: "mobile",
              type: "text",
              name: "mobile",
              value: this.mobileNumber,
              maxlength: textLen.mobile.max,
            }),
            error: this.errors.get("mobile"),
          })
        ],
        submitBtn: Button.primary()
          .setName("保存")
          .setDisableWith("正在保存..."),
      }),
    };
  }
}
