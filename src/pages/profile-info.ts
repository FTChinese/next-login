import { Flash } from "../widget/flash";
import { TextInputElement } from "../widget/text-input";
import { RadioInputElement } from "../widget/radio-input";
import { ProfileFormData, Account, Profile } from "../models/reader";
import { validate, ValidationError } from "@hapi/joi";
import { profileSchema, joiOptions, reduceJoiErrors } from "./validator";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { Button } from "../widget/button";
import { profileService } from "../repository/profile";
import { APIError } from "../repository/api-response";

export interface ProfileInfoPage {
  flash?: Flash;
  form?: {
    familyName: FormControl;
    givenName: FormControl;
    genderMale: FormControl;
    genderFemale: FormControl;
    birthday: FormControl;
    submitBtn: Button;
  }
}

export class ProfileInfoBuilder {

  errors: Map<string, string> = new Map(); // Hold validator error for each form field. Key is field's name attribute.
  flashMsg?: string; // Hold message for API non-422 error.
  profile: Profile;
  formData: ProfileFormData;

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

  // Validate form data.
  async validate(data: ProfileFormData): Promise<boolean> {
    try {
      const result = await validate<ProfileFormData>(data, profileSchema, joiOptions);

      this.formData = result;

      return true;
    } catch (e) {
      this.errors = reduceJoiErrors(e as ValidationError)
      return false;
    }
  }

  async update(account: Account): Promise<boolean> {
    try {
      const ok = await profileService.updateProfile(account.id, this.formData);

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

  build(): ProfileInfoPage {
    const page: ProfileInfoPage = {
      flash: this.flashMsg
        ? Flash.danger(this.flashMsg)
        : undefined
    }

    if (!this.profile && !this.formData) {
      return page;
    }

    if (!this.formData) {
      this.formData = this.profile;
    }

    page.form = {
      familyName: new FormControl({
        label: {
          text: "姓"
        },
        controlType: ControlType.Text,
        field: new TextInputElement({
          id: "familyName",
          name: "profile[familyName]",
          type: "text",
          value: this.formData.familyName,
        }),
        error: this.errors.get("familyName"),
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
          value: this.formData.givenName,
        }),
        error: this.errors.get("givenName"),
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
          checked: this.formData.gender === "M",
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
          checked: this.formData.gender === "F",
        }),
        error: this.errors.get("gender"),
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
          value: this.formData.birhtday,
        }),
        error: this.errors.get("birthday"),
      }),

      submitBtn: Button.primary()
        .setName("保存")
        .setDisableWith("保存..."),
    };

    return page;
  }
}


