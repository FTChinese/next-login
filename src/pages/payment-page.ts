import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { RadioInputElement } from "../widget/radio-input";
import { PaymentMethod, Edition } from "../models/enums";
import { AliOrder, WxOrder } from "../models/order";
import { subsService } from "../repository/subscription";
import { Account, isTestAccount } from "../models/account";
import { HeaderApp } from "../models/header";
import { APIError } from "../models/api-response";
import { toDataURL } from "qrcode";
import { subsMap } from "../config/sitemap";
import {  MembershipParser } from "../models/membership";
import { Cart, Plan, PlanParser} from "../models/paywall";
import { isMobile } from "../util/detector";
import { buildStripeCart, newCheckoutJWTPayload } from "../models/stripe";

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
  warning?: string;
  // The form to show a list of pament method:
  // Alipay;
  // Wxpay;
  // Stripe.
  form?: Form;
  qr?: WxQR; // Use to show Wechat payment QR Code if user selected wxpay.
  useStripe?: boolean; // Determine whether DOM element and js should be added to page. Used by the pay.html and base.html page.
  stripeApiJwt?: string;
}


/**
 * PaymentPageBuilder calculates and converts the data to be visible on payment page.
 */
export class PaymentPageBuilder {
  private flashMsg?: string; // In case any errors when fetching data from API, or form submitted being invalid.
  private payMethod?: PaymentMethod; // Payment method user chosen. Exits only after the POST method and validate() method is called.
  private wxOrder?: WxOrder;
  private useStripe = false;

  private mp: MembershipParser; // Membership.
  private plan?: Plan; // The plan chosen.
  
  // To build the payment page, all we need to know is
  // user account and the edition of product.
  constructor(
    readonly account: Account,
    readonly edition: Edition,
  ) {
    this.mp = new MembershipParser(account.membership);
  }

  // Find the plan user chosen.
  async loadPlan(): Promise<boolean> {
    try {
      const plan = await subsService.getFtcPlan(this.edition, isTestAccount(this.account));
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

  private buildPayControls(payMethods: PaymentMethod[]): FormControl[] {
    const controls: FormControl[] = [];

    for (const method of payMethods) {
      switch (method) {
        case 'alipay':
          controls.push(
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
                checked: this.payMethod === method,
              }),
              extraWrapperClass: "mb-3",
            })
          );
          break;

        case 'wechat':
          controls.push(
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
                checked: this.payMethod === method,
              }),
              extraWrapperClass: 'mb-3',
            })
          );
          break;

        case 'stripe':
          controls.push(
            new FormControl({
              label: {
                text: 'Stripe',
                imageUrl: 'http://www.ftacademy.cn/images/stripe-58x24.png',
                suffix: true,
              },
              controlType: ControlType.Radio,
              field: new RadioInputElement({
                id: "stripe",
                name: "payMethod",
                value: "stripe",
                checked: this.payMethod === method,
              }),
              extraWrapperClass: 'mb-3',
            })
          );
          break;
      }
    }

    return controls;
  }

  async build(): Promise<PaymentPage> {
    if (!this.plan) {
      throw new Error('Pricing plan not found');
    }

    const intent = this.mp.checkoutIntent(this.edition);
    // Use pricing plan to build cart.
    const planParser = new PlanParser(this.plan);

    const p: PaymentPage = {
      pageTitle: "订阅支付",
      flash: this.flashMsg 
        ? Flash.danger(this.flashMsg)
        : undefined,
      sandbox: isTestAccount(this.account),
      cart: intent.orderKind
        ? planParser.buildCart(intent.orderKind)
        : undefined,
      warning: intent.warning,
    };

    if (intent.payMethods.length == 0) {
      return p;
    }

    // If wxOrder does not exist, show the 
    // payment method selection form,
    // otherwise show Wechat payment's QRCode
    if (!this.wxOrder && !this.useStripe) {
      // Only show the form when user is not a member,
      // or membership expired.
      // For valid Stripe, IAP and B2B, do not process it.
      p.form = new Form({
        disabled: false,
        method: "post",
        action: "",
        controls: this.buildPayControls(intent.payMethods),
        submitBtn: Button.primary()
          .setName(`支付 ${p.cart?.payable}`)
          .setBlock()
          .setDisableWith("提交..."),
      });

      return p;
    }

    // Wechat pay order exists.
    if (this.wxOrder) {
      const dataUrl = await toDataURL(this.wxOrder.qrCodeUrl);
      
      p.qr = {
        dataUrl,
        doneLink: subsMap.wxpayDone,
      };
  
      return p;
    }
    
    const [ token, price ] = await Promise.all([
      newCheckoutJWTPayload(this.account, this.plan),
      subsService.getStripePrice(
        this.plan, 
        isTestAccount(this.account),
      ),
    ]);

    if (intent.orderKind && price) {
      p.cart = buildStripeCart(intent.orderKind, price)
    }
    p.stripeApiJwt = token;

    // Chose to use stripe.
    return p;
  }

  // Validate payment method after user submitted it
  // and remember it.
  validate(payMethod?: PaymentMethod): boolean {
    if (!payMethod) {
      this.flashMsg = "请选择支付方式";

      return false;
    }

    const allowedMethods: PaymentMethod[] = [
      'alipay',
      'wechat',
      'stripe'
    ];

    if (!allowedMethods.includes(payMethod)) {
      this.flashMsg = "请从支付宝或微信支付中选择一种支付方式";

      return false;
    }

    this.payMethod = payMethod
    this.useStripe = payMethod === 'stripe';
    return true;
  }

  // Handles payment via Ali. Called after HTTP POST and user chosen alipay.
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

  // Handles payment via Wechat. Called after HTTP POSt and payment method wechat is chosen.
  // `wxOrder` field will be populated after success.
  async wxpay(client: HeaderApp): Promise<WxOrder | null> {
    if (!this.plan) {
      throw new Error('Pricing plan not found');
    }

    try {
      const wxOrder = await subsService.wxDesktopPay(this.plan, {
        appHeaders: client,
        account: this.account,
      });

      this.wxOrder = wxOrder;

      return wxOrder;
    } catch (e) {
      const errResp = new APIError(e);

      this.flashMsg = errResp.message;

      return null;
    }
  }
}
