import { validate, ValidationError } from "@hapi/joi";
import debug from "debug";
import { UIBase, ITextInput, UISingleInput } from "../viewmodels/ui";
import { APIError, IFetchResult } from "../repository/api-response";
import {
  userNameSchema,
  mobileSchema,
  addressSchema,
  buildJoiErrors,
  IFormState,
} from "./validator";
import {
  Account,
  Profile,
  Address,
  IName,
  IMobile,
  IAddress,
} from "../models/reader";

import { profileService } from "../repository/profile";
import { Flash } from "../widget/flash";
import { profileMap } from "../config/sitemap";
import { KeyUpdated, getMsgUpdated } from "./redirection";

const log = debug("user:profile-viewmodel");

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

interface ProfilePage {
  flash?: Flash;
  profile?: Profile;
  address?: Address;
  links: {
    displayName: string;
    mobile: string;
    personal: string;
    address: string;
  };
}

export class ProfilePageBuilder {
  flashMsg?: string
  profile?: Profile;
  address?: Address;

  async fetchData(account: Account): Promise<boolean> {
    try {
      const [profile, address] = await Promise.all([
        profileService.fetchProfile(account.id),
        profileService.fetchAddress(account.id),
      ]);

      this.profile = profile;
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

  build(done?: KeyUpdated): ProfilePage {

    let flash: Flash | undefined;
    if (done) {
      flash = Flash.success(getMsgUpdated(done));
    } else if (this.flashMsg) {
      flash = Flash.danger(this.flashMsg);
    }
    
    return {
      flash: flash,
      profile: this.profile,
      address: this.address,
      links: profileMap,
    };
  }
}

