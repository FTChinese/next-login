import {
    jsonObject,
    jsonMember,
    jsonArrayMember,
    TypedJSON,
} from "typedjson";
import { Tier, Cycle } from "./reader";
import { subsMap } from "../config/sitemap";
import { 
    currencySymbols, 
    intervals 
} from "./localization";
import { formatMoney } from "../util/formatter";
import { getProperty } from "./index-types";

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
class Plan {

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
        return currencySymbols.get(this.currency) || this.currency.toUpperCase();
    }

    get paymentLink(): string {
        return `${subsMap.pay}/${this.tier}/${this.cycle}`;
    }

    get highlight(): boolean {
        return this.cycle == "year";
    }

    get priceText(): string {
        return `${this.currSymbol} ${formatMoney(this.price)}/${getProperty(intervals, this.cycle)}`;
    }

    get discountText(): string | null {
        if (this.price == this.amount) {
            return null;
        }

        return `${this.currSymbol} ${formatMoney(this.amount)}/${getProperty(intervals, this.cycle)}`;
    }
}

@jsonObject
export class Product {
    @jsonMember
    heading: string;

    @jsonArrayMember(String)
    benefits: Array<string>;

    @jsonMember
    smallPrint?: string;

    @jsonArrayMember(Plan)
    plans: Array<Plan>;

    constructor(tier?: Tier) {
        const stdYear = new Plan("standard", "year");
        const stdMonth = new Plan("standard", "month");
        const premium = new Plan("premium");

        switch (tier) {
            case "standard":
                this.heading = "标准会员";
                this.benefits = [
                    `专享订阅内容每日仅需${stdYear.dailyPrice}元(或按月订阅每日${stdMonth.dailyPrice}元)`,
                    "精选深度分析",
                    "中英双语内容",
                    "金融英语速读训练",
                    "英语原声电台",
                    "无限浏览7日前所有历史文章（近8万篇）"
                ];
                this.plans = [
                    stdYear,
                    stdMonth,
                ];
                break;

            case "premium":
                this.heading = "标准会员";
                this.benefits = [
                    `专享订阅内容每日仅需${premium.dailyPrice}元`,
                    "享受“标准会员”所有权益",
                    "编辑精选，总编/各版块主编每周五为您推荐本周必读资讯，分享他们的思考与观点",
                    "FT中文网2018年度论坛门票2张，价值3999元/张 （不含差旅与食宿）"
                ];
                this.smallPrint = "注：所有活动门票不可折算现金、不能转让、不含差旅与食宿";
                this.plans = [
                    premium,
                ];
                break;
        }
    }
}





