import { Account, customerServiceEmail, isTestAccount } from "../models/account";
import { accountService } from "../repository/account";
import { APIError } from "../models/api-response";
import { Flash } from "../widget/flash";
import { MembershipParser, MemberStatus } from "../models/membership";
import { newPaywallUI, Paywall, PaywallUI } from "../models/paywall";
import { subsService } from "../repository/subscription";

/** template: subscription/membership.html */
interface MembershipPage {
  pageTitle: string;
  flash?: Flash;
  member?: MemberStatus;
  paywall: PaywallUI;
  serviceMail: string;
}

export class MembershipPageBuilder {
  flashMsg?: string;

  private account: Account;
  private paywall: Paywall;

  constructor(account: Account) {
    this.account = account;
  }

  async refresh(): Promise<boolean> {
    try {
      const [account, paywall] = await Promise.all([
        accountService.refreshAccount(this.account),
        subsService.paywall(isTestAccount(this.account)),
      ]);

      this.account = account;
      this.paywall = paywall;

      return true;
    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;

      return false;
    }
  }

  build(): MembershipPage {
    const parser = new MembershipParser(this.account.membership);
    
    return {
      pageTitle: "会员订阅",
      flash: this.flashMsg 
        ? Flash.danger(this.flashMsg) 
        : undefined,
      member: parser.statusUI,
      paywall: newPaywallUI(this.paywall),
      serviceMail: customerServiceEmail(this.account),
    };
  }
}
