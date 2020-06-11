import { Account } from "../models/account";
import debug from "debug";
import { Flash } from "../widget/flash";
import { SimpleList, Table } from "../widget/list";
import { AliOrder, IAliCallback, formatPlanName, WxOrder, IWxQueryResult } from "../models/order";
import { accountService } from "../repository/account";
import { APIError } from "../models/api-response";
import { subsMap } from "../config/sitemap";
import { subRepo } from "../repository/subscription";
import { formatMoneyInCent, iso8601ToCST } from "../util/formatter";
import { Plan, findPlan, netPrice, listPrice } from "../models/product";

const log = debug("user:pay-result-page");

/** template: subscription/pay-done.html */
interface PayResultPage {
  flash?: Flash;
  guide: SimpleList;
  backLink: string;
  success?: Table;
  failed?: SimpleList;
}

const successMsg = "您可以打印本页以备日后查询，或者返回查看会员状态和订单历史。";
const failureMsg = "暂时未查询到支付结果，您可以返回查看会员状态和订单历史。";

abstract class PayResultBuilder {
  
  flashMsg?: string;
  plan?: Plan;
  failureMsg?: string;

  constructor(
    protected account: Account,
  ) {}

  protected buildThanksMsg(succeeded: boolean): SimpleList {
    const rows = [];
    if (this.plan) {
      rows.push(formatPlanName(this.plan.tier, this.plan.cycle));
      rows.push(netPrice(this.plan) || listPrice(this.plan));
    }

    if (succeeded) {
      rows.push(successMsg)
    } else {
      rows.push(failureMsg)
    }
    return {
      header: "感谢您订阅FT中文网会员",
      rows,
    }
  }

  async refresh(): Promise<Account | null> {
    try {
      return await accountService.refreshAccount(this.account);
    } catch(e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;
      return null;
    }
  }
}

export class AlipayResultBuilder extends PayResultBuilder{

  param?: IAliCallback;

  constructor(
    account: Account,
    private order: AliOrder,
  ){
    super(account);
    this.plan = findPlan(order.tier, order.cycle) || undefined;
  }

  validate(param: IAliCallback): boolean {
    if (this.order.id != param.out_trade_no) {
      this.failureMsg = "订单号不匹配";
      return false;
    }

    this.param = param;
    return true;
  }

  build(): PayResultPage {
    return {
      flash: this.flashMsg 
        ? Flash.danger(this.flashMsg)
        : undefined,
      guide: this.buildThanksMsg(!!this.param),
      backLink: subsMap.base,
      success: this.param ? {
        caption: "支付宝支付结果",
        rows: [
          ["订单号", this.param.out_trade_no],
          ["金额", this.param.total_amount],
          ["支付宝交易号", this.param.trade_no],
          ["支付时间", this.param.timestamp]
        ]
      } : undefined,
      failed: this.failureMsg ? {
        header: "支付宝支付失败",
        rows: [
          `原因: ${this.failureMsg}`,
        ]
      } : undefined
    }
  }
}

export class WxpayResultBuilder extends PayResultBuilder {

  queryResult?: IWxQueryResult;

  constructor(
    account: Account,
    readonly order: WxOrder,
  ) {
    super(account);
    this.plan = findPlan(order.tier, order.cycle) || undefined;
  }

  // Query payment result from Wechat API.
  async validate(): Promise<boolean> {
    // Use the following data to test success result.
    // const queryResult: IWxQueryResult = {
    //     "paymentState": "SUCCESS",
    //     "paymentStateDesc": "支付成功",
    //     "totalFee": 1,
    //     "transactionId": "4200000252201903069440709666",
    //     "ftcOrderId": "FT1D3CEDDB2599EFB9",
    //     "paidAt": "2019-03-06T07:21:18Z"
    // };
    try {
      const result = await subRepo.wxOrderQuery(this.account, this.order.id);

      log("WX order validation result: %O", result);

      if (result.paymentState !== "SUCCESS") {
        this.failureMsg = result.paymentStateDesc;
        return false;
      }


      this.queryResult = result;
      return true;
    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;

      return false;
    }
  }

  build(): PayResultPage {
    return {
      flash: this.flashMsg
        ? Flash.danger(this.flashMsg)
        : undefined,
      guide: this.buildThanksMsg(!!this.queryResult),
      backLink: subsMap.base,
      success: this.queryResult ? {
        caption: "微信支付结果",
        rows: [
          ["订单号", this.queryResult.ftcOrderId],
          ["支付状态", this.queryResult.paymentStateDesc],
          ["金额", formatMoneyInCent(this.queryResult.totalFee)],
          ["微信交易号", this.queryResult.transactionId],
          ["支付时间", iso8601ToCST(this.queryResult.paidAt)]
        ]
      } : undefined,
      failed: this.failureMsg ? {
        header: "微信支付失败",
        rows: [
          `原因: ${this.failureMsg}`,
        ]
      } : undefined
    }
  }
}
