import { viper } from "../config/viper";
import { Tier } from "../models/enums";
import { Cycle } from "../models/enums";

class ReaderAPI {
  readonly baseUrl: string = viper.readerAPIBaseUrl;

  readonly baseUrlAuth = `${this.baseUrl}/users`;
  readonly baseUrlUser = `${this.baseUrl}/user`;

  readonly exists: string = `${this.baseUrlAuth}/exists`;
  readonly signup: string = `${this.baseUrlAuth}/signup`;
  readonly login: string = `${this.baseUrlAuth}/login`;
  verifyEmail(token: string): string {
    return `${this.baseUrlAuth}/verify/email/${token}`;
  }
  readonly passwordResetLetter: string = `${this.baseUrlAuth}/password-reset/letter`;
  passwordResetToken(token: string): string {
    return `${this.baseUrlAuth}/password-reset/tokens/${token}`;
  }
  readonly resetPassword: string = `${this.baseUrlAuth}/password-reset`;

  readonly account: string = `${this.baseUrlUser}/account`;
  readonly profile: string = `${this.baseUrlUser}/profile`;
  readonly email: string = `${this.baseUrlUser}/email`;
  readonly requestVerification: string = `${this.baseUrlUser}/email/request-verification`;
  readonly name: string = `${this.baseUrlUser}/name`;
  readonly mobile: string = `${this.baseUrlUser}/mobile`;
  readonly password: string = `${this.baseUrlUser}/password`;
  readonly wxAccount: string = `${this.baseUrlUser}/wx/account/v2`;
  readonly wxSignUp: string = `${this.baseUrlUser}/wx/signup`;

  readonly linking: string = `${this.baseUrlUser}/wx/link`;
  readonly orders: string = `${this.baseUrlUser}/orders`;
  readonly address: string = `${this.baseUrlUser}/address`;
  // newsletter: `${user}/newsletter`,
  readonly starred: string = `${this.baseUrlUser}/starred`;
  readonly androidLatest = `${this.baseUrl}/apps/android/latest`;
  readonly androidReleases = `${this.baseUrl}/apps/android/releases`;
}

class SubAPI {
  private baseURLs = viper.subsAPIBaseUrl;

  private getBaseUrl(sandbox: boolean): string {
    if (!viper.isProduction) {
      return this.baseURLs.dev;
    }

    if (sandbox) {
      return this.baseURLs.sandbox;
    }

    return this.baseURLs.prod;
  }

  paywall(sandbox: boolean): string {
    return `${this.getBaseUrl(sandbox)}/paywall`;
  }

  pricingPlans(sandbox: boolean): string {
    return `${this.paywall(sandbox)}/pricing`;
  }

  upgradeBalance(sandbox: boolean): string {
    return `${this.getBaseUrl(sandbox)}/upgrade/balance`;
  }

  freeUpgrade(sandbox: boolean): string {
    return `${this.getBaseUrl(sandbox)}/upgrade/free`;
  }

  aliPayDesktop(sandbox: boolean): string {
    return `${this.getBaseUrl(sandbox)}/alipay/desktop`;
  }

  aliPayMobile(sandbox: boolean): string {
    return `${this.getBaseUrl(sandbox)}/alipay/mobile`;
  }

  wxPayDesktop(sandbox: boolean): string {
    return `${this.getBaseUrl(sandbox)}/wxpay/desktop`;
  }
  
  wxQueryOrder(orderId: string, sandbox: boolean): string {
    return `${this.getBaseUrl(sandbox)}/wxpay/query/${orderId}`;
  }

  private readonly wxRedirectPath: string = "/wx/oauth/callback";

  // The sandbox mode is used only to test new API features.
  // As long as Wechat does not change its API, we do not need to use the sandbox mode.
  wxRedirect(sandbox: boolean = false): string {
    return `${this.getBaseUrl(sandbox)}${this.wxRedirectPath}`;
  }

  // Send wechat OAuth2 code here
  readonly wxLogin: string = `${this.baseURLs.prod}/wx/oauth/login`;

  readonly redeemGiftCard: string = `${this.baseURLs.prod}/gift-card/redeem`;
}

export const readerApi = new ReaderAPI();
export const subsApi = new SubAPI();
