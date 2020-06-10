import debug from "debug";
import { APIError } from "../models/api-response";
import {
  Account,
  Profile,
  Wechat,
  isAccountWxOnly,
} from "../models/account";

import { profileService } from "../repository/profile";
import { Flash } from "../widget/flash";
import { profileMap, accountMap } from "../config/sitemap";
import { KeyUpdated, getMsgUpdated } from "./redirection";
import { TableRow } from "../widget/list";
import { localizeGender } from "../models/localization";

const log = debug("user:profile-viewmodel");

/** template: profile/profile.html */
interface ProfilePage {
  pageTitle: string;
  flash?: Flash;
  isWxOnly: boolean;
  wechat: Wechat;
  linkFtcUrl: string;
  rows?: TableRow[];
}

export class ProfilePageBuilder {
  flashMsg?: string
  profile?: Profile;

  constructor (readonly account: Account) {}

  async fetchData(): Promise<boolean> {
    if (isAccountWxOnly(this.account)) {
      return true;
    }
    
    try {
      const profile = await profileService.fetchProfile(this.account.id);

      this.profile = profile;
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
    
    const p: ProfilePage = {
      pageTitle: "我的资料",
      flash: flash,
      isWxOnly: isAccountWxOnly(this.account),
      wechat: this.account.wechat,
      linkFtcUrl: accountMap.linkEmail
    }

    if (p.isWxOnly) {
      return p;
    }

    p.rows = [
      {
        cells: [
          {
            left: "用户名",
            right: this.profile?.userName || ""
          },
        ],
        disclosure: {
          text: "修改",
          href: profileMap.displayName,
        },
      },
      {
        cells: [
          {
            left: "手机号码",
            right: this.profile?.mobile || ""
          }
        ],
        disclosure: {
          text: "修改",
          href: profileMap.mobile,
        },
      },
      {
        cells: [
          {
            left: "姓名",
            right: this.profile?.familyName || "",
          },
          {
            left: "性别",
            right: localizeGender(this.profile?.gender),
          },
          {
            left: "生日",
            right: this.profile?.birthday || "",
          },
        ],
        disclosure: {
          text: "修改",
          href: profileMap.personal,
        }
      },
      {
        cells: [
          {
            left: "地址",
            right: `${this.profile?.address.country || ""} ${this.profile?.address.province || ""} ${this.profile?.address.city} ${this.profile?.address.district}`,
          },
          {
            left: "",
            right: this.profile?.address.street || ""
          },
          {
            left: "",
            right: this.profile?.address.postcode || ""
          }
        ],
        disclosure: {
          text: "修改",
          href: profileMap.address,
        }
      }
    ];

    return p;
  }
}

