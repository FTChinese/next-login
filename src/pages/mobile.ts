import { Profile, Account, IMobile } from "../models/reader";
import { profileService } from "../repository/profile";
import { APIError } from "../repository/api-response";
import { joiOptions, reduceJoiErrors, mobileSchema } from "./validator";
import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { TextInputElement } from "../widget/text-input";
import { ControlType } from "../widget/widget";
import { FormPage } from "./form-page";

export class MobileBuilder {
  flashMsg?: string;
  errors: Map<string, string> = new Map();
  profile?: Profile

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

  async validate(data: IMobile): Promise<boolean> {
    try {
      const result = await mobileSchema.validateAsync(data, joiOptions);

      Object.assign(this.profile, result);

      return true;
    } catch (e) {

      this.errors = reduceJoiErrors(e)

      return false;
    }
  }

  async update(account: Account): Promise<boolean> {
    if (!this.profile?.mobile) {
      throw new Error("mobile number does not exist");
    }

    try {
      const ok = await profileService.updateMobile(account.id, {mobile: this.profile.mobile});

      return ok;
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.unprocessable) {
        this.errors = errResp.unprocessable.toMap()

        return false;
      }

      this.flashMsg = errResp.message;
      return false;
    }
  }

  build(): FormPage {
    const page: FormPage = {
      heading: "手机号码",
    }

    if (this.flashMsg) {
      page.flash = Flash.danger(this.flashMsg);
    }

    // For GET, if fetching user data failed, does not display the form.
    // The flash field should have value.
    if (!this.profile) {
      return page;
    }

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
            name: "profile[mobile]",
            value: this.profile?.userName,
            maxlength: 11,
          }),
          error: this.errors.get("mobile"),
        })
      ],
      submitBtn: Button.primary()
        .setName("保存")
        .setDisableWith("正在保存..."),
    });

    return page;
  }
}
