import { Account, customerServiceEmail } from "../models/account";
import { accountService } from "../repository/account";
import { APIError } from "../models/api-response";
import { subsMap } from "../config/sitemap";
import { DateTime } from "luxon";
import { Flash } from "../widget/flash";
import { Membership, isMember } from "../models/membership";
import { Card } from "../widget/card";
import { localizeTier, localizeCycle } from "../models/localization";
import { Product, listPrice, netPrice, paywall, paymentUrl } from "../models/product";
import { Element } from "../widget/element";

interface UIMembership {
  card: Card;
  renewalReminder?: Flash; // Present when expireDate is approaching or already expired.
  renewalUrl?: string; // If expireDate - today <= 3 years
  ordersLink?: string; // Only present for payment method alipay and wechat. Stripe, Appl IAP and B2B do not have orders.
}

interface UIProduct {
  heading: string;
  description: string[];
  smallPrint: string | null;
  priceElems: Element[];
}

/** Build HTML element for price here. These are dynamic and too hard to maitain in template. */
function buildProductUI(isMember: boolean, product: Product): UIProduct {

  const wrappers = product.plans.map(p => {
    const lPrice = listPrice(p);
    const nPrice = netPrice(p);

    const wrapper = isMember
      ? new Element("div")
      : new Element("a")
        .addClass("btn")
        .addClass(
          p.cycle === "year" 
            ? " btn-primary" 
            : "btn-outline-primary"
        )
        .setAttribute("href", paymentUrl(p.tier, p.cycle));

    wrapper.appendChild(
      new Element("span").withText(`${lPrice}/${localizeCycle(p.cycle)}`)
    );

    if (nPrice) {
      wrapper.appendChild(
        new Element("s").withText(`${nPrice}/${localizeCycle(p.cycle)}`)
      );
    }

    return wrapper;
  });

  return {
    heading: product.heading,
    description: product.description,
    smallPrint: product.smallPrint,
    priceElems: wrappers,
  }
}

/** template: subscription/membership.html */
interface MembershipPage {
  pageTitle: string;
  flash?: Flash;
  member?: UIMembership;
  products: UIProduct[];
  serviceMail: string;
}

export class MembershipPageBuilder {
  flashMsg?: string;
  private _account: Account;
  private expireOn: DateTime | null = null;
  private isMember: boolean = false;

  constructor(account: Account) {
    this.initAccount = account;
  }

  private set initAccount(val: Account) {
    this._account = val;
    if (val.membership.expireDate) {
      this.expireOn = DateTime.fromISO(val.membership.expireDate);
    }
    this.isMember = isMember(val.membership)
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
      pageTitle: "会员订阅",
      flash: this.flashMsg ? Flash.danger(this.flashMsg) : undefined,
      member: this.buildMemberUI(),
      products: paywall.products
        .map(p => buildProductUI(this.isMember, p)),
      serviceMail: customerServiceEmail(this.account),
    };
  }

  private buildMemberUI(): UIMembership | undefined {
    const m = this.account.membership;

    if (!isMember(m)) {
      return undefined;
    }

    const remainingDays = this.memberRemainingDays();
    const expiration = this.account.membership.tier === "vip" 
      ? "无限期"
      : this.account.membership.expireDate || "";
    const urgeMsg = this.urgeRenewal(remainingDays)
    const renewalUrl = this.renewalUrl(m);

    return {
      card: {
        header: "我的订阅",
        list: [
          {
            label: "会员类型",
            value: localizeTier(m.tier),
          },
          {
            label: "会员期限",
            value: expiration,
          }
        ]
      },
      renewalReminder: urgeMsg 
        ? Flash.danger(urgeMsg)
          .setDismissible(false) 
        : undefined,
      renewalUrl: renewalUrl,
      ordersLink: (m.payMethod === "alipay" || m.payMethod === 'wechat')
        ? subsMap.orders
        : undefined,
    };
  }

  /**
   * Determine whether a subscriptin is allowed to renew.
   * Only when a subscription exists and expiration date
   * does not goes beyond 3 years later.
   * expiration date - today <= 3
   */
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

  private renewalUrl(m: Membership): string {
    if (!m.tier || !m.cycle) {
      return "";
    }

    if (!this.permitRenewal()) {
      return ""
    }

    return paymentUrl(m.tier, m.cycle);
  }
}
