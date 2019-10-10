import {
    jsonMember,
    jsonObject,
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

@jsonObject
export class AliOrder extends OrderBase {
    @jsonMember
    redirectUrl: string;
}

// We could only use wechat pay in desktop browser
// for this app.
@jsonObject
export class WxOrder extends OrderBase {
    @jsonMember
    qrCodeUrl: string;
}
