import { Cycle, Tier } from "../models/enums";

const prefix = "";

export const entranceMap = {
    signup:         `${prefix}/signup`,
    passwordReset:  `${prefix}/password-reset`,
    login:          `${prefix}/login`,
    wxLogin:        `${prefix}/login/wechat`,
    authorize:      `${prefix}/oauth2/authorize`,
    logout:         `${prefix}/logout`,
    verifyEmail:    `${prefix}/verify/email`,
};

export const profileMap = {
    base:         `${prefix}/profile`,
    displayName:    `${prefix}/profile/display-name`,
    mobile:         `${prefix}/profile/mobile`,
    personal:       `${prefix}/profile/info`,
    address:        `${prefix}/profile/address`,
};

export const accountMap = {
    base:               `${prefix}/account`,
    email:              `${prefix}/account/email`,
    password:           `${prefix}/account/password`,
    requestVerification: `${prefix}/account/request-verification`,
    linkEmail:      `${prefix}/account/link/email`,
    linkFtcLogin:   `${prefix}/account/link/login`,
    linkMerging:    `${prefix}/account/link/merge`,
    linkSignUp:         `${prefix}/account/link/signup`,
    unlinkWx:       `${prefix}/account/unlink`,
};

class SubsMap {
  readonly base =           `${prefix}/subscription`;
  readonly test =           `${this.base}/test`;
  readonly renewal =        `${this.base}/renew`;
  readonly orders =         `${this.base}/orders`;
  readonly pay =            `${this.base}/pay`;
  readonly alipayDone =     `${this.base}/done/ali`;
  readonly wxpayDone =      `${this.base}/done/wx`;
  readonly redeem =         `${this.base}/redeem`;

  checkoutUrl(tier: Tier, cycle: Cycle): string {
    return `${this.pay}/${tier}/${cycle}`;
  }

  aliReturnUrl(origin: string): string {
    return `${origin}${this.alipayDone}`
  }
}

export const subsMap = new SubsMap();

export const starredMap = {
    base: `${prefix}/starred`,
};

export const androidMap = {
    latest: `${prefix}/android/latest`,
    releases: `${prefix}/android/releases`,
};
