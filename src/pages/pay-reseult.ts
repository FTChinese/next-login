import { Account } from "../models/reader";
import { Flash } from "../widget/flash";
import { IListItem } from "../viewmodels/ui";
import { AliOrder, IAliCallback, formatPlanName, WxOrder, IWxQueryResult } from "../models/order";
import { accountService } from "../repository/account";
import { APIError } from "../repository/api-response";
import { subsMap } from "../config/sitemap";
import { subRepo } from "../repository/subscription";
import { formatMoneyInCent, iso8601ToCST } from "../util/formatter";

interface PayResultPage {
  flash?: Flash;
  product: string;
  caption: string;
  rows?: Array<IListItem>;
  backLink: string;
}

export class PayResultBuilder {
  
  flashMsg?: string;

  constructor(
    private account: Account,
  ) {}

  async refresh(): Promise<Account | null> {
    try {
      return await accountService.refreshAccount(this.account);
    } catch(e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;
      return null;
    }
  }

  validateAli(order: AliOrder, param: IAliCallback): boolean {
    if (order.id != param.out_trade_no) {
      this.flashMsg = "订单号不匹配";
      return false;
    }

    return true;
  }

  buildAli(order: AliOrder, param: IAliCallback): PayResultPage {
    return {
      flash: this.flashMsg 
        ? Flash.danger(this.flashMsg)
        : undefined,
      product: formatPlanName(order.tier, order.cycle),
      caption: "支付宝支付结果",
      rows: this.flashMsg
        ? undefined
        : [
          {
            label: "订单号",
            value: param.out_trade_no,
          },
          {
            label: "金额",
            value: param.total_amount,
          },
          {
            label: "支付宝交易号",
            value: param.trade_no
          },
          {
            label: "支付时间",
            value: param.timestamp,
          },
        ],
      backLink: subsMap.base,
    }
  }

  async validateWx(orderId: string): Promise<IWxQueryResult | null> {
    try {
      const result = await subRepo.wxOrderQuery(this.account, orderId);

      if (result.paymentState !== "SUCCESS") {
        this.flashMsg = result.paymentStateDesc;
        return null;
      }

      return result;
    } catch (e) {
      const errResp = new APIError(e);
      this.flashMsg = errResp.message;

      return null;
    }
  }

  buildWx(order: WxOrder, queryResult: IWxQueryResult | null): PayResultPage {
    return {
      flash: this.flashMsg
        ? Flash.danger(this.flashMsg)
        : undefined,
      
      product: formatPlanName(order.tier, order.cycle),
      caption: "微信支付结果",
      rows: queryResult
        ? 
        [
          {
            label: "订单号",
            value: queryResult.ftcOrderId,
          },
          {
            label: "支付状态",
            value: queryResult.paymentStateDesc,
          },
          {
            label: "金额",
            value: formatMoneyInCent(queryResult.totalFee),
          },
          {
            label: "微信交易号",
            value: queryResult.transactionId
          },
          {
            label: "支付时间",
            value: iso8601ToCST(queryResult.paidAt),
          },
        ] : undefined,
      backLink: subsMap.base,
    }
  }
}
