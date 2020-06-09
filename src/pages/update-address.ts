import { Account, Address } from "../models/account";
import { profileService } from "../repository/profile";
import { APIError } from "../models/api-response";
import { joiOptions, reduceJoiErrors, addressSchema } from "./validator";
import { Flash } from "../widget/flash";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { TextInputElement } from "../widget/text-input";
import { ControlType } from "../widget/widget";
import { ValidationError } from "@hapi/joi";

interface AddressPage {
  flash?: Flash;
  form?: {
    country: FormControl;
    province: FormControl;
    city: FormControl;
    district: FormControl;
    street: FormControl;
    postcode: FormControl;
    submitBtn: Button;
  }
}

export class AddressBuilder {
  flashMsg?: string;
  errors: Map<string, string> = new Map();
  address?: Address;
  
  async fetch(account: Account): Promise<boolean> {
    try {
      const address = await profileService.fetchAddress(account.id);

      this.address = address;

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

  async validate(data: Address): Promise<boolean> {
    try {
      const result = await addressSchema.validateAsync(data, joiOptions);

      this.address = result;

      return true;
    } catch (e) {

      this.errors = reduceJoiErrors(e as ValidationError);

      return false;
    }
  }

  async update(account: Account): Promise<boolean> {
    if (!this.address) {
      throw new Error("Address does not exist");
    }

    try {
      const ok = await profileService.updateAddress(account.id, this.address);

      return ok;
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.unprocessable) {
        this.errors = errResp.controlErrs

        return false;
      }

      this.flashMsg = errResp.message;
      return false;
    }
  }

  build(): AddressPage {
    const page: AddressPage = {}

    if (this.flashMsg) {
      page.flash = Flash.danger(this.flashMsg);
    }

    // For GET, if fetching user data failed, does not display the form.
    // The flash field should have value.
    if (!this.address) {
      return page;
    }

    page.form = {
      country: new FormControl({
        label: {
          text: "国家",
        },
        controlType: ControlType.Text,
        field: new TextInputElement({
          id: "country",
          name: "address[country]",
          type: "text",
          value: this.address?.country,
        }),
        error: this.errors.get("country"),
      }),
      
      province: new FormControl({
        label: {
          text: "省/直辖市",
        },
        controlType: ControlType.Text,
        field: new TextInputElement({
          id: "province",
          name: "address[province]",
          type: "text",
          value: this.address?.province,
        }),
        error: this.errors.get("province"),
        extraWrapperClass: "col-md-4"
      }),

      city: new FormControl({
        label: {
          text: "市",
        },
        controlType: ControlType.Text,
        field: new TextInputElement({
          id: "city",
            name: "address[city]",
          type: "text",
          value: this.address?.city,
        }),
        error: this.errors.get("city"),
        extraWrapperClass: "col-md-4"
      }),

      district: new FormControl({
        label: {
          text: "区/县",
        },
        controlType: ControlType.Text,
        field: new TextInputElement({
          id: "district",
            name: "address[district]",
          type: "text",
          value: this.address?.district,
        }),
        error: this.errors.get("district"),
        extraWrapperClass: "col-md-4"
      }),

      street: new FormControl({
        label: {
          text: "街道",
        },
        controlType: ControlType.Text,
        field: new TextInputElement({
          id: "street",
          name: "address[street]",
          type: "text",
          value: this.address?.street,
        }),
        error: this.errors.get("street"),
        extraWrapperClass: "col-md-10"
      }),

      postcode: new FormControl({
        label: {
          text: "邮编",
        },
        controlType: ControlType.Text,
        field: new TextInputElement({
          id: "postcode",
          name: "address[postcode]",
          type: "text",
          value: this.address?.postcode,
        }),
        error: this.errors.get("postcode"),
        extraWrapperClass: "col-md-2"
      }),

      submitBtn: Button.primary()
        .setName("保存")
        .setDisableWith("正在保存..."),
    }

    return page;
  }
}
