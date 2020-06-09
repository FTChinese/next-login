
import { 
    Tier, 
    Cycle, 
    OrderType, 
    PaymentMethod ,
} from "./enums";
import {
    localizeTier,
    localizeCycle,
} from "./localization";

export interface OrderBase {
    id: string;
    price: number;
    amount: number;
    tier: Tier;
    cycle: Cycle;
    cycleCount: number;
    extraDays: number;
    usageType: OrderType;
    payMethod: PaymentMethod;
    createdAt: string;
}

export function formatPlanName(tier: Tier, cycle: Cycle): string {
  return `${localizeTier(tier)}/${localizeCycle(cycle)}`;
}

export interface AliOrder extends OrderBase {
    redirectUrl: string;
}

// We could only use wechat pay in desktop browser
// for this app.
export interface WxOrder extends OrderBase {
    qrCodeUrl: string;
}

export interface IAliCallback {
    charset: string;
    out_trade_no: string;
    method: string;
    total_amount: string;
    sign: string;
    trade_no: string;
    auth_app_id: string;
    version: string;
    app_id: string;
    sign_type: string;
    seller_id: string;
    timestamp: string;
}

export interface IWxQueryResult {
    paymentState: "SUCCESS" | "REFUND" | "NOTPAY" | "CLOSED" | "REVOKED" | "USERPAYING" | "PAYERROR";
    paymentStateDesc: string;
    totalFee: number;
    transactionId: string;
    ftcOrderId: string;
    paidAt: string;
}
