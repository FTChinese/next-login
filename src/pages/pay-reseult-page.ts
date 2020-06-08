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

class PayResultBuilder {
  
  flashMsg?: string;

  constructor(
    protected account: Account,
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
}

export class AlipayResultBuilder extends PayResultBuilder{

  param?: IAliCallback;

  constructor(
    account: Account,
    private order: AliOrder,
  ){
    super(account);

  }

  validate(param: IAliCallback): boolean {
    if (this.order.id != param.out_trade_no) {
      this.flashMsg = "订单号不匹配";
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
      product: formatPlanName(this.order.tier, this.order.cycle),
      caption: "支付宝支付结果",
      rows: this.param
        ? 
        [
          {
            label: "订单号",
            value: this.param.out_trade_no,
          },
          {
            label: "金额",
            value: this.param.total_amount,
          },
          {
            label: "支付宝交易号",
            value: this.param.trade_no
          },
          {
            label: "支付时间",
            value: this.param.timestamp,
          },
        ]
        : undefined,
      backLink: subsMap.base,
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
  }

  async validate(): Promise<boolean> {
    try {
      const result = await subRepo.wxOrderQuery(this.account, this.order.id);

      if (result.paymentState !== "SUCCESS") {
        this.flashMsg = result.paymentStateDesc;
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
      
      product: formatPlanName(this.order.tier, this.order.cycle),
      caption: "微信支付结果",
      rows: this.queryResult
        ? 
        [
          {
            label: "订单号",
            value: this.queryResult.ftcOrderId,
          },
          {
            label: "支付状态",
            value: this.queryResult.paymentStateDesc,
          },
          {
            label: "金额",
            value: formatMoneyInCent(this.queryResult.totalFee),
          },
          {
            label: "微信交易号",
            value: this.queryResult.transactionId
          },
          {
            label: "支付时间",
            value: iso8601ToCST(this.queryResult.paidAt),
          },
        ] : undefined,
      backLink: subsMap.base,
    }
  }
}
