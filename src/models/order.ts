import {
    jsonMember,
    jsonObject,
    TypedJSON,
} from "typedjson";
import { 
    Tier, 
    Cycle, 
    OrderType, 
    PaymentMethod ,
} from "./enums";

@jsonObject
export class OrderBase {
    @jsonMember
    id: string;

    @jsonMember
    price: number;

    @jsonMember
    amount: number;

    @jsonMember
    tier: Tier;

    @jsonMember
    cycle: Cycle;

    @jsonMember
    cycleCount: number;

    @jsonMember
    extraDays: number;

    @jsonMember
    usageType: OrderType;

    @jsonMember
    payMethod: PaymentMethod;

    @jsonMember
    createdAt: string;
}

export const orderSerializer = new TypedJSON(OrderBase);

@jsonObject
export class AliOrder extends OrderBase {
    @jsonMember
    redirectUrl: string;
}

export const aliOrderSerializer = new TypedJSON(AliOrder);

// We could only use wechat pay in desktop browser
// for this app.
@jsonObject
export class WxOrder extends OrderBase {
    @jsonMember
    qrCodeUrl: string;
}

export const wxOrderSerializer = new TypedJSON(WxOrder);

export interface AliCallback {
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
