import {
    jsonObject,
    jsonMember,
    jsonArrayMember,
} from "typedjson";
import { Tier, Cycle } from "./enums";
import { subsMap } from "../config/sitemap";
import { 
    currencySymbols, localizeCycle,  
} from "./localization";
import { formatMoney } from "../util/formatter";
import { Dictionary } from "./data-types";
import { DateTime } from "luxon";

@jsonObject
export class Banner {
    @jsonMember
    heading: string = "FT中文网会员订阅服务";

    @jsonMember
    subHeading: string = "欢迎您";

    @jsonMember
    coverUrl: string = "http://www.ftacademy.cn/subscription.jpg";

    @jsonArrayMember(String)
    content: Array<string> = [
        "希望全球视野的FT中文网，能够带您站在高海拔的地方俯瞰世界，引发您的思考，从不同的角度看到不一样的事物，见他人之未见！"
    ];
}

@jsonObject
export class Plan {

    @jsonMember
    tier: Tier;

    @jsonMember
    cycle: Cycle;

    @jsonMember
    price: number;

    @jsonMember
    amount: number;

    @jsonMember
    currency: string;

    @jsonMember
    description: string;

    constructor(tier?: Tier, cycle?: Cycle) {
        switch (tier) {
            case "standard":
                switch (cycle) {
                    case "year":
                        this.initStandardYear();
                        break;

                    case "month":
                        this.initStandardMonth();
                        break;
                }
                break;

            case "premium":
                this.initPremiumYear();
                break;
        }
    }

    private initStandardYear() {
        this.tier = "standard";
        this.cycle = "year";
        this.price = 258;
        this.amount = 258;
        this.currency = "cny";
        this.description = "FT中文网 - 年度标准会员";
    }

    private initStandardMonth() {
        this.tier = "standard";
        this.cycle = "month";
        this.price = 28;
        this.amount = 28;
        this.currency = "cny";
        this.description = "FT中文网 - 月度标准会员";
    }

    private initPremiumYear() {
        this.tier = "premium";
        this.cycle = "year";
        this.price = 1998;
        this.amount = 1998;
        this.currency = "cny";
        this.description = "FT中文网 - 年度高端会员";
    }

    // Divisor shoud be 30 for monthly subscription, and
    // 365 for yearly subscription.
    get dailyPrice(): string {
        if (this.cycle == "month") {
            return formatMoney(this.price / 30);
        }

        return formatMoney(this.price / 365);
    }

    get currSymbol(): string {
        return currencySymbols[this.currency] || this.currency.toUpperCase();
    }

    get paymentLink(): string {
        return `${subsMap.pay}/${this.tier}/${this.cycle}`;
    }

    get highlight(): boolean {
        return this.cycle == "year";
    }

    get priceText(): string {
        return `${this.currSymbol} ${formatMoney(this.price)}/${localizeCycle(this.cycle)}`;
    }

    get discountText(): string | null {
        if (this.price == this.amount) {
            return null;
        }

        return `${this.currSymbol} ${formatMoney(this.amount)}/${localizeCycle(this.cycle)}`;
    }
}

interface IFtcPlans extends Dictionary<Plan> {
    standard_year: Plan;
    standard_month: Plan;
    premium_year: Plan;
}

export interface IPaywall {
    banner: Banner;
    plans: IFtcPlans;
}

// Data fetch from API for promotion.
interface IPromo extends IPaywall {
    startAt: string;
    endAt: string;
}

// Manully initialize the Promo from IPromo since the data string should be parsed.
class Promo implements IPaywall {
    private readonly startTime: DateTime;
    private readonly endTime: DateTime;
    readonly banner: Banner;
    readonly plans: IFtcPlans;

    constructor(promo: IPromo) {
        this.startTime = DateTime.fromISO(promo.startAt);
        this.endTime = DateTime.fromISO(promo.endAt);
        this.banner = promo.banner;
        this.plans = promo.plans
    }

    get isInEffect(): boolean {
        if (!this.startTime.isValid || !this.endTime.isValid) {
            return false;
        }

        const now = DateTime.utc();

        if (this.startTime <= now && this.endTime >= now) {
            return true;
        }

        return false;
    }
}

// Determines whether promo should be used.
class Scheduler {
    private readonly defaultPaywall: IPaywall = {
        banner: new Banner(),
        plans: {
            standard_year: new Plan("standard", "year"),
            standard_month: new Plan("standard", "month"),
            premium_year: new Plan("premium"),
        },
    };

    private promo?: Promo;

    setPromo(p: Promo) {
        this.promo = p;
    }

    get paywall(): IPaywall {
        if (this.promo && this.promo.isInEffect) {
            return this.promo;
        }

        return this.defaultPaywall;
    }

    get plans(): IFtcPlans {
        return this.paywall.plans;
    }

    findPlan(tier: Tier, cycle: Cycle): Plan | null {
        const key = `${tier}_${cycle}`;
    
        const plan = this.plans[key];
        if (plan) {
            return plan;
        }
    
        return null;
    }
}

export const scheduler = new Scheduler();
