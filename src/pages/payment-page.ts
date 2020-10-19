import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { RadioInputElement } from "../widget/radio-input";
import { Cycle, PaymentMethod, Tier } from "../models/enums";
import { AliOrder, WxOrder } from "../models/order";
import { subsService, AlipayConfig } from "../repository/subscription";
import { Account, collectAccountIDs, isTestAccount } from "../models/account";
import { HeaderApp, HeaderReaderId } from "../models/header";
import { APIError } from "../models/api-response";
import { toDataURL } from "qrcode";
import { subsMap } from "../config/sitemap";
import { isMember } from "../models/membership";
import { Cart, newCart, Plan} from "../models/paywall";
import { isMobile } from "../util/detector";

interface UIQR {
  dataUrl: string;
  doneLink: string;
}

/** template: subscription/pay.html */
interface PaymentPage {
  pageTitle: string,
  flash?: Flash;
  sandbox: boolean;
  cart: Cart;
  form?: Form;
  qr?: UIQR; // Use to show Wechat payment QR Code if user selected wxpay.
}

export class PaymentPageBuilder {
  flashMsg?: string;
  payMethod?: PaymentMethod;
  wxOrder?: WxOrder;
  idHeaders: HeaderReaderId;
  private isTest = false;
  private plan: Plan;
  
  constructor(
    readonly account: Account,
  ) {
    this.idHeaders = collectAccountIDs(account);
    this.isTest = isTestAccount(this.account);
  }

  async loadPlan(tier: Tier, cycle: Cycle): Promise<boolean> {
    try {
      const plan = await subsService.pricingPlan(tier, cycle);
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

    const p: PaymentPage = {
      pageTitle: "订阅支付",
      flash: this.flashMsg 
        ? Flash.danger(this.flashMsg)
        : undefined,
      sandbox: this.isTest,
      cart: newCart(this.plan, isMember(this.account.membership))
    };

    // If wxOrder does not exist, show the 
    // payment method selection form,
    // otherwise show Wechat payment's QRCode
    if (!this.wxOrder) {
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
          .setName(`支付 ${p.cart.payable}`)
          .setBlock()
          .setDisableWith("提交..."),
      });
    } else {
      const dataUrl = await toDataURL(this.wxOrder.qrCodeUrl);
      
      p.qr = {
        dataUrl,
        doneLink: subsMap.wxpayDone,
      };
    }

    return p;
  }

  async alipay(config: Pick<AlipayConfig, "appHeaders" | "originUrl">): Promise<AliOrder | null> {
    
    const mobile = isMobile(config.appHeaders["X-User-Agent"]);

    try {
      if (mobile) {
        return await subsService.aliMobilePay(this.plan, {
          ...config,
          idHeaders: this.idHeaders,
          sandbox: this.isTest,
        });
      }
      
      return await subsService.aliDesktopPay(this.plan, {
        ...config,
        idHeaders: this.idHeaders,
        sandbox: this.isTest,
      });

    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;
      return null;
    }
  }

  async wxpay(client: HeaderApp): Promise<boolean> {
    try {
      const wxOrder = await subsService.wxDesktopPay(this.plan,{
        idHeaders: this.idHeaders,
        appHeaders: client,
        sandbox: this.isTest,
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
