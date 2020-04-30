import { validate, ValidationError } from "@hapi/joi";
import debug from "debug";
import { UIBase, ITextInput, UISingleInput } from "./ui";
import { KeyUpdated, getMsgUpdated } from "./redirection";
import { APIError, IFetchResult } from "./api-response";
import {
  userNameSchema,
  mobileSchema,
  addressSchema,
  buildJoiErrors,
  IFormState,
} from "../pages/validator";
import {
  Account,
  Profile,
  Address,
  IName,
  IMobile,
  IAddress,
} from "../models/reader";

import { profileService } from "../repository/profile";

const log = debug("user:profile-viewmodel");

interface UIProfile extends UIBase {
  profile?: Profile;
  address?: Address;
}

interface IUpdateNameResult extends IFetchResult<boolean> {
  errForm?: IName;
}

interface IUpdateMobileResult extends IFetchResult<boolean> {
  errForm?: IMobile;
}

interface IUpdateAddressResult extends IFetchResult<boolean> {
  errForm?: IAddress;
}

interface IFormGroup extends ITextInput {
  col?: number;
}

interface UIAddress extends UIBase {
  formRows?: Array<Array<IFormGroup>>;
}

class ProfileViewModel {
  async fetchProfile(account: Account): Promise<IFetchResult<Profile>> {
    try {
      const profile = await profileService.fetchProfile(account.id);

      return {
        success: profile,
      };
    } catch (e) {
      return {
        errResp: new APIError(e),
      };
    }
  }

  async fetchAddress(account: Account): Promise<IFetchResult<Address>> {
    try {
      const addr = await profileService.fetchAddress(account.id);

      return {
        success: addr,
      };
    } catch (e) {
      return {
        errResp: new APIError(e),
      };
    }
  }

  async buildProfileUI(
    account: Account,
    done?: KeyUpdated
  ): Promise<UIProfile> {
    const [profile, address] = await Promise.all([
      profileService.fetchProfile(account.id),
      profileService.fetchAddress(account.id),
    ]);

    return {
      alert: done ? { message: getMsgUpdated(done) } : undefined,
      profile,
      address,
    };
  }

  /**
   * @description Update user name.
   */
  async validateName(data: IName): Promise<IFormState<IName>> {
    try {
      const result = await validate<IName>(data, userNameSchema);

      return {
        values: result,
      };
    } catch (e) {
      const ex: ValidationError = e;

      return {
        errors: buildJoiErrors(ex.details) as IName,
      };
    }
  }

  async updateName(
    account: Account,
    formData: IName
  ): Promise<IUpdateNameResult> {
    const { values, errors } = await this.validateName(formData);

    if (errors) {
      return {
        errForm: errors,
      };
    }

    if (!values) {
      throw new Error("invalid form data to update display name");
    }

    try {
      const ok = await profileService.updateName(account.id, values);

      return {
        success: ok,
      };
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.error) {
        const o = errResp.error.toMap();

        log("Error message: %O", o);

        return {
          errForm: {
            userName: o.get(errResp.error.field) || "",
          },
        };
      }

      return {
        errResp,
      };
    }
  }

  /**
   * @description Build the ui data for updating display name.
   * For GET, the `formData` and `result` should not
   * exist, thus we fetch user profile from API
   * and use the `Profile.userName` to set the form input value.
   */
  buildNameUI(formData?: IName, result?: IUpdateNameResult): UISingleInput {
    if (formData) {
      formData.userName = formData.userName.trim();
    }

    // if (!formData) {
    //     const success = await profileRepo.fetchProfile(account.id);

    //     formData = {
    //         userName: success.userName || "",
    //     };
    // }

    const { errForm, errResp } = result || {};
    return {
      // Contains API error for PATCH request.
      errors: errResp ? { message: errResp.message } : undefined,
      heading: "用户名",
      input: {
        label: "",
        id: "name",
        type: "text",
        name: "profile[userName]",
        value: formData ? formData.userName : "",
        maxlength: "64",
        desc: "20字符以内",
        error: errForm ? errForm.userName : undefined,
      },
    };
  }

  /**
   * @description Update mobile
   */
  async validateMobile(data: IMobile): Promise<IFormState<IMobile>> {
    try {
      const result = await validate<IMobile>(data, mobileSchema);

      return {
        values: result,
      };
    } catch (e) {
      const ex: ValidationError = e;

      return {
        errors: buildJoiErrors(ex.details) as IMobile,
      };
    }
  }

  async updateMobile(
    account: Account,
    formData: IMobile
  ): Promise<IUpdateMobileResult> {
    const { values, errors } = await this.validateMobile(formData);

    if (errors) {
      return {
        errForm: errors,
      };
    }

    if (!values) {
      throw new Error("invalid form data to update display name");
    }

    try {
      const ok = await profileService.updateMobile(account.id, values);

      return {
        success: ok,
      };
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.error) {
        const o = errResp.error.toMap();

        return {
          errForm: {
            mobile: o.get(errResp.error.field) || "",
          },
        };
      }

      return {
        errResp,
      };
    }
  }

  /**
   * @description Build the ui data for updating display name.
   * For GET, the `formData` and `result` should not
   * exist, thus we fetch user profile from API
   * and use the `Profile.userName` to set the form input value.
   */
  buildMobileUI(
    formData?: IMobile,
    result?: IUpdateMobileResult
  ): UISingleInput {
    if (formData) {
      formData.mobile = formData.mobile.trim();
    }

    const { errForm, errResp } = result || {};
    const uiData: UISingleInput = {
      // Contains API error for PATCH request.
      errors: errResp ? { message: errResp.message } : undefined,
      heading: "手机号码",
      input: {
        label: "",
        id: "mobile",
        type: "text",
        name: "profile[mobile]",
        value: formData ? formData.mobile : "",
        maxlength: "11",
        error: errForm ? errForm.mobile : undefined,
      },
    };

    return uiData;
  }

  async validateAddress(data: IAddress): Promise<IFormState<IAddress>> {
    try {
      const result = await validate<IAddress>(data, addressSchema);

      return {
        values: result,
      };
    } catch (e) {
      const ex: ValidationError = e;

      return {
        errors: buildJoiErrors(ex.details) as IAddress,
      };
    }
  }

  async updateAddress(
    account: Account,
    formData: IAddress
  ): Promise<IUpdateAddressResult> {
    const { values, errors } = await this.validateAddress(formData);

    if (errors) {
      return {
        errForm: errors,
      };
    }

    if (!values) {
      throw new Error("invalid form data to update address");
    }

    try {
      const ok = await profileService.updateAddress(account.id, values);

      return {
        success: ok,
      };
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.error) {
        const o = errResp.error.toMap();

        return {
          errForm: {
            country: o.get("country") || "",
            province: o.get("province") || "",
            city: o.get("city") || "",
            district: o.get("district") || "",
            street: o.get("street") || "",
            postcode: o.get("postcode") || "",
          },
        };
      }

      return {
        errResp,
      };
    }
  }

  buildAddressUI(
    formData?: IAddress,
    result?: IUpdateAddressResult
  ): UIAddress {
    const { errForm, errResp } = result || {};
    return {
      errors: errResp
        ? {
            message: errResp.message,
          }
        : undefined,
      formRows: [
        [
          {
            label: "国家",
            type: "text",
            id: "country",
            name: "address[country]",
            value: formData ? formData.country : "",
            error: errForm ? errForm.country : undefined,
          },
        ],
        [
          {
            label: "省/直辖市",
            type: "text",
            id: "province",
            name: "address[province]",
            value: formData ? formData.province : "",
            error: errForm ? errForm.province : undefined,
            col: 4,
          },
          {
            label: "市",
            type: "text",
            id: "city",
            name: "address[city]",
            value: formData ? formData.city : "",
            error: errForm ? errForm.city : undefined,
            col: 4,
          },
          {
            label: "区/县",
            type: "text",
            id: "district",
            name: "address[district]",
            value: formData ? formData.district : "",
            error: errForm ? errForm.district : undefined,
            col: 4,
          },
        ],
        [
          {
            label: "街道",
            type: "text",
            id: "street",
            name: "address[street]",
            value: formData ? formData.street : "",
            error: errForm ? errForm.street : undefined,
            col: 10,
          },
          {
            label: "邮编",
            type: "text",
            id: "postcode",
            name: "address[postcode]",
            value: formData ? formData.postcode : "",
            error: errForm ? errForm.postcode : undefined,
            col: 2,
          },
        ],
      ],
    };
  }
}

export const profileViewModel = new ProfileViewModel();
