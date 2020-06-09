import { Profile, Account } from "../models/account";
import { profileService } from "../repository/profile";
import { APIError } from "../models/api-response";
import { userNameSchema, joiOptions, reduceJoiErrors, textLen } from "./validator";
import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { TextInputElement } from "../widget/text-input";
import { ControlType } from "../widget/widget";
import { FormPage } from "./form-page";
import debug from "debug";
import { NameForm } from "../models/form-data";

const log = debug("user:display-name");

export class DisplayNameBuilder {
  flashMsg?: string;
  errors: Map<string, string> = new Map();
  profile?: Profile
  formData?: NameForm

  get userName(): string {
    if (this.formData) {
      return this.formData.userName;
    }

    if (this.profile) {
      return this.profile.userName || '';
    }

    return '';
  }

  async fetchProfile(account: Account): Promise<boolean> {
    try {
      const p = await profileService.fetchProfile(account.id);

      this.profile = p;

      log("Profile: %O", p);

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

  async validate(data: NameForm): Promise<boolean> {
    try {
      const result = await userNameSchema.validateAsync(data, joiOptions);

      this.formData = result

      return true;
    } catch (e) {

      this.errors = reduceJoiErrors(e)

      return false;
    }
  }

  async update(account: Account): Promise<boolean> {
    if (!this.formData) {
      throw new Error("form data does not exist");
    }

    try {
      const ok = await profileService.updateName(account.id, this.formData);

      return ok;
    } catch (e) {
      log("Error when udpating username: %O", e);

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
      heading: "用户名",
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
              id: "name",
              type: "text",
              name: "userName",
              value: this.userName,
              maxlength: textLen.userName.max,
            }),
            desc: "32字符以内",
            error: this.errors.get("userName"),
          })
        ],
        submitBtn: Button.primary()
          .setName("保存")
          .setDisableWith("正在保存..."),
      }),
    };
  }
}
