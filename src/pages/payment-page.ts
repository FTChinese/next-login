import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { RadioInputElement } from "../widget/radio-input";
import { PaymentMethod } from "../models/enums";
import { AliOrder, WxOrder } from "../models/order";
import { subRepo, AlipayConfig } from "../repository/subscription";
import { Account, collectAccountIDs } from "../models/account";
import { HeaderApp, HeaderReaderId } from "../models/header";
import { APIError } from "../models/api-response";
import { toDataURL } from "qrcode";
import { subsMap } from "../config/sitemap";
import { Card } from "../widget/card";
import { subsPlanName, listPrice, netPrice, Plan } from "../models/product";
import { isMember } from "../models/membership";

interface UIQR {
  dataUrl: string;
  doneLink: string;
}

/** template: subscription/pay.html */
interface PaymentPage {
  pageTitle: string,
  flash?: Flash;
  sandbox: boolean;
  card: Card;
  form?: Form;
  qr?: UIQR; // Use to show Wechat payment QR Code if user selected wxpay.
}

export class PaymentPageBuilder {
  flashMsg?: string;
  payMethod?: PaymentMethod;
  wxOrder?: WxOrder;
  idHeaders: HeaderReaderId;

  constructor(
    readonly plan: Plan,
    readonly account: Account,
    readonly sandbox: boolean
  ) {
    this.idHeaders = collectAccountIDs(account);
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
      sandbox: this.sandbox,
      card: {
        header: isMember(this.account.membership)
          ? "续订FT会员"
          : "订阅FT会员",
        list: [
          {
            primary: "会员类型:",
            secondary: subsPlanName(this.plan.tier, this.plan.cycle)
          },
          {
            primary: "支付金额:",
            secondary: netPrice(this.plan) || listPrice(this.plan)
          }
        ]
      }
    };

    // If wxOrder does not exist, show the 
    // payment method selection form,
    // otherwise show Wechat payment's QRCode
    if (!this.wxOrder) {
      p.form = new Form({
        disabled: false,
        method: "post",
        action: this.sandbox ? "?sandbox=true" : "",
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
          .setName("支付")
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

  async alipay(config: Pick<AlipayConfig, "appHeaders" | "aliCallbackUrl"> & { isMobile: boolean }): Promise<AliOrder | null> {
    
    try {
      if (config.isMobile) {
        return await subRepo.aliMobilePay(this.plan, {
          idHeaders: this.idHeaders,
          appHeaders: config.appHeaders,
          sandbox: this.sandbox,
          aliCallbackUrl: config.aliCallbackUrl,
        });
      }
      
      return await subRepo.aliDesktopPay(this.plan, {
        idHeaders: this.idHeaders,
        appHeaders: config.appHeaders,
        sandbox: this.sandbox,
        aliCallbackUrl: config.aliCallbackUrl,
      });
    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;
      return null;
    }
  }

  async wxpay(client: HeaderApp): Promise<boolean> {
    try {
      const wxOrder = await subRepo.wxDesktopPay(this.plan,{
        idHeaders: this.idHeaders,
        appHeaders: client,
        sandbox: this.sandbox,
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
