import { Profile, IName, Account } from "../models/reader";
import { profileService } from "../repository/profile";
import { APIError } from "../repository/api-response";
import { validate } from "@hapi/joi";
import { userNameSchema, joiOptions, reduceJoiErrors } from "./validator";
import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { TextInputElement } from "../widget/text-input";
import { ControlType } from "../widget/widget";
import { FormOnlyPage } from "./data-builder";

export class DisplayNameBuilder {
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

  async validate(data: IName): Promise<boolean> {
    try {
      const result = await validate<IName>(data, userNameSchema, joiOptions);

      Object.assign(this.profile, result);

      return true;
    } catch (e) {

      this.errors = reduceJoiErrors(e)

      return false;
    }
  }

  async update(account: Account): Promise<boolean> {
    if (!this.profile?.userName) {
      throw new Error("userName does not exist");
    }

    try {
      const ok = await profileService.updateName(account.id, {userName: this.profile.userName});

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

  build(): FormOnlyPage {
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
              name: "profile[userName]",
              value: this.profile?.userName,
              maxlength: 32,
            }),
            desc: "32字符以内",
            error: this.errors.get("displayName"),
          })
        ],
        submitBtn: Button.primary()
          .setName("保存")
          .setDisableWith("正在保存..."),
      }),
    };
  }
}
