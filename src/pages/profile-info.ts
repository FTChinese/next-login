import { Flash } from "../widget/flash";
import { TextInputElement } from "../widget/text-input";
import { RadioInputElement } from "../widget/radio-input";
import { DataBuilder } from "./data-builder";
import { ProfileFormData, Account } from "../models/reader";
import { validate, ValidationError } from "@hapi/joi";
import { profileSchema, joiOptions } from "./validator";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { Button } from "../widget/button";
import { profileService } from "../repository/profile";
import { APIError } from "../repository/api-response";

export class ProfileInfoBuilder extends DataBuilder<ProfileFormData> {

  constructor (data: ProfileFormData) {
    super(data)
  }

  // Validate form data.
  async validate(): Promise<boolean> {
    try {
      const result = await validate<ProfileFormData>(this.data, profileSchema, joiOptions);

      Object.assign(this.data, result);

      return true;
    } catch (e) {
      this.reduceJoiErrors(e as ValidationError)
      return false;
    }
  }

  async update(account: Account): Promise<boolean> {
    try {
      const ok = await profileService.updateProfile(account.id, this.data);

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
}

export class ProfileInfoPage {
  flash?: Flash;
  form?: {
    familyName: FormControl;
    givenName: FormControl;
    genderMale: FormControl;
    genderFemale: FormControl;
    birthday: FormControl;
    submitBtn: Button;
  }
  
  constructor (b: ProfileInfoBuilder | string) {
    if (typeof b === "string") {
      this.flash = Flash.danger(b);
      return;
    }

    if (b.flashMsg) {
      this.flash = Flash.danger(b.flashMsg);
    }

    this.form = {
      familyName: new FormControl({
        label: {
          text: "姓"
        },
        controlType: ControlType.Text,
        field: new TextInputElement({
          id: "familyName",
          name: "profile[familyName]",
          type: "text",
          value: b.data.familyName,
        }),
        error: b.errors.get("familyName"),
      }),

      givenName: new FormControl({
        label: {
          text: "名",
        },
        controlType: ControlType.Text,
        field: new TextInputElement({
          type: "text",
          id: "givenName",
          name: "profile[givenName]",
          value: b.data.givenName,
        }),
        error: b.errors.get("givenName"),
      }),

      genderMale: new FormControl({
        label: {
          text: "男",
          suffix: true,
        },
        controlType: ControlType.Radio,
        field: new RadioInputElement({
          id: "genderM",
          name: "profile[gender]",
          value: "M",
          checked: b.data.gender === "M",
        }),
      }),

      genderFemale: new FormControl({
        label: {
          text: "女",
          suffix: true,
        },
        controlType: ControlType.Radio,
        field: new RadioInputElement({
          id: "genderF",
          name: "profile[gender]",
          value: "F",
          checked: b.data.gender === "F",
        }),
        error: b.errors.get("gender"),
      }),

      birthday: new FormControl({
        label: {
          text: "生日",
        },
        controlType: ControlType.Text,
        field: new TextInputElement({
          id: "birthday",
          type: "date",
          name: "profile[birthday]",
          value: b.data.birhtday,
        }),
        error: b.errors.get("birthday"),
      }),

      submitBtn: Button.primary()
        .setName("保存")
        .setDisableWith("保存..."),
    };
  }
}
