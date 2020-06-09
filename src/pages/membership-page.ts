import { Account, customerServiceEmail } from "../models/reader";
import { accountService } from "../repository/account";
import { APIError } from "../models/api-response";
import { subsMap } from "../config/sitemap";
import { DateTime } from "luxon";
import { Tier } from "../models/enums";
import { Flash } from "../widget/flash";
import { IPaywall, Banner, Plan, scheduler } from "../models/paywall";
import { Membership } from "../models/membership";

interface UIMembership {
  tier?: Tier;
  expiration: string;
  renewalReminder?: Flash; // Present when expireDate is approaching or already expired.
  renewalUrl?: string; // If expireDate - today <= 3 years
  ordersLink?: string; // Only present for payment method alipay and wechat. Stripe, Appl IAP and B2B do not have orders.
}

interface UIProduct {
  heading: string;
  benefits: Array<string>;
  smallPrint?: string;
  plans: Array<Plan>
}

interface UIPaywall {
  banner: Banner;
  products: Array<UIProduct>;
}

interface MembershipPage {
  flash?: Flash;
  member?: UIMembership;
  paywall: UIPaywall;
  serviceMail: string;
}

export class MembershipPageBuilder {
  flashMsg?: string;
  private _account: Account;
  private expireOn: DateTime | null = null;

  constructor(account: Account) {
    this.initAccount = account;
  }

  private set initAccount(val: Account) {
    this._account = val;
    if (val.membership.expireDate) {
      this.expireOn = DateTime.fromISO(val.membership.expireDate);
    }
  }

  get account(): Account {
    return this._account;
  }

  async refresh(): Promise<boolean> {
    try {
      this.initAccount = await accountService.refreshAccount(this.account);

      return true;
    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;

      return false;
    }
  }

  build(): MembershipPage {
    return {
      flash: this.flashMsg ? Flash.danger(this.flashMsg) : undefined,
      member: this.buildMemberUI(),
      paywall: this.buildPaywallUI(scheduler.paywall),
      serviceMail: customerServiceEmail(this._account),
    };
  }

  private permitRenewal(): boolean {
    if (!this.expireOn) {
      return false;
    }

    return this.expireOn <= DateTime.local().plus({ year: 3 });
  }

  /**
   * The reaming valid days of membership.
   */
  private memberRemainingDays(): number | null {

    if (!this.expireOn) {
      return null;
    }

    const today = DateTime.local().startOf("day");

    const diffInDays = this.expireOn.diff(today, "days");

    return diffInDays.toObject().days || null;
  }

  private urgeRenewal(remains: number | null): string {
    if (!remains) {
      return ""
    } else if (remains < 0) {
      return "会员已经过期，请续订";
    } else if (remains > 0 && remains <= 7) {
      return `会员即将过期，剩余${remains}天，请续订`;
    }

    return "";
  }

  /**
   * @todo Limit max renewal length to 3 years.
   * @param m 
   */
  private renewalUrl(m: Membership): string {
    if (!m.tier || !m.cycle) {
      return "";
    }

    if (!this.permitRenewal()) {
      return ""
    }

    return `${subsMap.pay}/${m.tier}/${m.cycle}`;
  }

  private buildMemberUI(): UIMembership | undefined {
    const m = this.account.membership;

    if (m.tier || m.cycle || m.expireDate) {
      return undefined;
    }

    const remainingDays = this.memberRemainingDays();
    const expiration = this.account.membership.tier === "vip" 
      ? "无限期"
      : this.account.membership.expireDate;
    const urgeMsg = this.urgeRenewal(remainingDays)
    const renewalUrl = this.renewalUrl(m);

    return {
      tier: this.account.membership.tier || undefined,
      expiration: expiration || "",
      renewalReminder: urgeMsg ? Flash.danger(urgeMsg) : undefined,
      renewalUrl: renewalUrl,
      ordersLink: (m.payMethod === "alipay" || m.payMethod === 'wechat')
        ? subsMap.orders
        : undefined,
    };
  }

  private buildPaywallUI(data: IPaywall): UIPaywall {
    return {
      banner: new Banner(),
      products: [
        {
          heading: "标准会员",
          benefits: [
            `专享订阅内容每日仅需${data.plans.standard_year.dailyPrice}元(或按月订阅每日${data.plans.standard_month.dailyPrice}元)`,
            "精选深度分析",
            "中英双语内容",
            "金融英语速读训练",
            "英语原声电台",
            "无限浏览7日前所有历史文章（近8万篇）"
          ],
          plans: [
            data.plans.standard_year,
            data.plans.standard_month,
          ]
        },
        {
          heading: "高端会员",
          benefits: [
            `专享订阅内容每日仅需${data.plans.premium_year.dailyPrice}元`,
            "享受“标准会员”所有权益",
            "编辑精选，总编/各版块主编每周五为您推荐本周必读资讯，分享他们的思考与观点",
            "FT中文网2018年度论坛门票2张，价值3999元/张 （不含差旅与食宿）"
          ],
          plans: [
            data.plans.premium_year,
          ]
        },
      ],
    };
  }
}
