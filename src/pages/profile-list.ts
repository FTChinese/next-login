import debug from "debug";
import { APIError } from "../models/api-response";
import {
  Account,
  Profile,
  Address,
} from "../models/reader";

import { profileService } from "../repository/profile";
import { Flash } from "../widget/flash";
import { profileMap } from "../config/sitemap";
import { KeyUpdated, getMsgUpdated } from "./redirection";

const log = debug("user:profile-viewmodel");

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

