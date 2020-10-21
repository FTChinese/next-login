import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { RadioInputElement } from "../widget/radio-input";
import { OrderType, PaymentMethod, Edition } from "../models/enums";
import { AliOrder, WxOrder } from "../models/order";
import { subsService } from "../repository/subscription";
import { Account, isTestAccount } from "../models/account";
import { HeaderApp } from "../models/header";
import { APIError } from "../models/api-response";
import { toDataURL } from "qrcode";
import { subsMap } from "../config/sitemap";
import {  MembershipParser } from "../models/membership";
import { Cart, Plan, PlanParser, UpgradeIntent, Wallet} from "../models/paywall";
import { isMobile } from "../util/detector";

// Define the section to show wechat QR code.
interface WxQR {
  dataUrl: string;
  doneLink: string;
}

/** template: subscription/pay.html 
 * `denied`, `form` and `qr` fields are mutually exclusive.
 */
interface PaymentPage {
  pageTitle: string,
  flash?: Flash;
  sandbox: boolean;
  cart?: Cart;
  // Tell Stripe and IAP user service not offered on desktop.
  denied?: string;
  // The form to show a list of pament method:
  // Alipay;
  // Wxpay;
  // Stripe.
  form?: Form;
  qr?: WxQR; // Use to show Wechat payment QR Code if user selected wxpay.
}

interface PaymentIntent {
  denied?: string; // The payment intent is denied and the reason is provided.
  useWallet: boolean;
}

export class PaymentPageBuilder {
  flashMsg?: string;
  payMethod?: PaymentMethod;
  wxOrder?: WxOrder;

  private mp: MembershipParser; // Membership.
  private orderKind: OrderType;

  private plan?: Plan; // The plan chosen.
  private paymentDenied?: string // reason why payment is denied.
  private upgradeIntent?: UpgradeIntent;
  
  constructor(
    readonly account: Account,
    readonly edition: Edition,
  ) {
    this.mp = new MembershipParser(account.membership);
    this.orderKind = this.deduceOrderKind;
  }

  // Deduce what kind of order user is creating
  // based on its current expiration time and tier.
  // This does not take into its current payment method,
  //  therefore you cannot take it as the final decision as different payment methods has specific requirements.
  private get deduceOrderKind(): OrderType {

    if (this.mp.renewOffExpired) {
      return 'create';
    }

    if (this.mp.member.tier === this.edition.tier) {
      return 'renew';
    }

    // Now user membership's tier !== selected plan tier.
    if (this.edition.tier === 'premium') {
      return 'upgrade';
    }

    if (this.edition.tier === 'standard') {
      return 'downgrade';
    }

    return 'create';
  }

  // Whether we should retrieve user's wallet.
  private get useWallet(): boolean {
    return this.mp.isAliOrWxPay && !this.mp.expired && this.orderKind === 'upgrade';
  }

  // Find the plan use chosen.
  async loadPlan(): Promise<boolean> {
    try {
      const plan = await subsService.pricingPlan(this.edition, isTestAccount(this.account));
      if (plan) {
        this.plan = plan;
        return true;
      }

      return false;
    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;
      return false;
    }
  }

  // Test if payment is allowed. Call this after loadPlan() and before loadBalance()
  isPaymentAllowed(): boolean {
    if (this.mp.renewOffExpired) {
      return true
    }

    switch (this.mp.member.payMethod) {
      case 'alipay':
      case 'wechat':
        const orderKind = this.orderKind;

        if (orderKind === 'renew' && !this.mp.canRenewViaAliWx) {
          this.paymentDenied = '剩余时间超出续订期限限制';
          return false;
        }

        return true;
      
      // If stripe is supported, provide ali, wx, and tell user the purchase will only be used upon stripe expiration.
      // There's a problem to tackle:
      // If orderKind is upgrade, obviously user want to change it immediately.
      case 'stripe':
        this.paymentDenied = 'Stripe支付目前仅支持安卓平台';
        return false;

      case 'apple':
        this.paymentDenied = 'App Store订阅需要在您的设备上管理。在您的苹果设备中依次打开“设置”，选择您的账号，点击“订阅”。';
        return false;

      case 'b2b':
        this.paymentDenied = '企业订阅请联系您所属机构的管理员。';
        return false
    }

    return true;
  }

  // Load balance for upgrading.
  async loadBalance(): Promise<boolean> {
    if (!this.useWallet) {
      return true;
    }

    try {
      const ui = await subsService.getBalance(this.account);

      this.upgradeIntent = ui;
      return true;
    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;
      return false;
    }
  }

  // Validate payment method after user submitted it.
  validate(payMethod?: PaymentMethod): boolean {
    if (!payMethod) {
      this.flashMsg = "请选择支付方式";

      return false;
    }

    if (payMethod != "alipay" && payMethod != "wechat") {
      this.flashMsg = "请从支付宝或微信支付中选择一种支付方式";

      return false;
    }

    this.payMethod = payMethod
    return true;
  }

  async build(): Promise<PaymentPage> {
    if (!this.plan) {
      throw new Error('Pricing plan not found');
    }

    const planParser = new PlanParser(this.plan);

    const p: PaymentPage = {
      pageTitle: "订阅支付",
      flash: this.flashMsg 
        ? Flash.danger(this.flashMsg)
        : undefined,
      sandbox: isTestAccount(this.account),
      cart: planParser.buildCart(this.orderKind, this.upgradeIntent?.wallet),
      denied: this.paymentDenied,
    };

    if (p.flash || p.denied) {
      return p;
    }

    // If wxOrder does not exist, show the 
    // payment method selection form,
    // otherwise show Wechat payment's QRCode
    if (!this.wxOrder) {
      // Only show the form when user is not a member,
      // or membership expired.
      // For valid Stripe, IAP and B2B, do not process it.
      p.form = new Form({
        disabled: false,
        method: "post",
        action: "",
        controls: [
          new FormControl({
            label: {
              text: '支付宝',
              imageUrl: 'http://www.ftacademy.cn/images/alipay-68x24.png',
              suffix: true,
            },
            controlType: ControlType.Radio,
            field: new RadioInputElement({
              id: "alipay",
              name: "payMethod",
              value: "alipay",
              checked: this.payMethod === "alipay",
            }),
            extraWrapperClass: "mb-3",
          }),
          new FormControl({
            label: {
              text: '微信支付',
              imageUrl: 'http://www.ftacademy.cn/images/wxpay-113x24.png',
              suffix: true,
            },
            controlType: ControlType.Radio,
            field: new RadioInputElement({
              id: "wechat",
              name: "payMethod",
              value: "wechat",
              checked: this.payMethod === "wechat",
            }),
            extraWrapperClass: 'mb-3',
          }),
        ],
        submitBtn: Button.primary()
          .setName(`支付 ${p.cart?.payable}`)
          .setBlock()
          .setDisableWith("提交..."),
      });

      return p;
    }

    const dataUrl = await toDataURL(this.wxOrder.qrCodeUrl);
      
    p.qr = {
      dataUrl,
      doneLink: subsMap.wxpayDone,
    };

    return p;
  }

  async alipay(client: HeaderApp, origin: string): Promise<AliOrder | null> {
    if (!this.plan) {
      throw new Error('Pricing plan not found');
    }

    const mobile = isMobile(client["X-User-Agent"]);

    try {
      if (mobile) {
        return await subsService.aliMobilePay(this.plan, {
          account: this.account,
          appHeaders: client,
          originUrl: origin
        });
      }
      
      return await subsService.aliDesktopPay(this.plan, {
        account: this.account,
        appHeaders: client,
        originUrl: origin,
      });

    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;
      return null;
    }
  }

  async wxpay(client: HeaderApp): Promise<boolean> {
    if (!this.plan) {
      throw new Error('Pricing plan not found');
    }

    try {
      const wxOrder = await subsService.wxDesktopPay(this.plan, {
        appHeaders: client,
        account: this.account,
      });

      this.wxOrder = wxOrder;

      return true;
    } catch (e) {
      const errResp = new APIError(e);

      this.flashMsg = errResp.message;

      return false;
    }
  }
}
