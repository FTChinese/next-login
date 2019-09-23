import { resolve } from "path";
import { configure, render } from "nunjucks"
import numeral from "numeral";
import { DateTime } from "luxon";

const localized = new Map([
    ["year", "年"],
    ["month", "月"],
    ["CNY", "¥"],
    ["standard", "标准会员"],
    ["premium", "高端会员"],
    ["tenpay", "微信支付"],
    ["alipay", "支付宝"],
]);

const alertMsg = new Map([
    ["saved", "保存成功！"],
    ["password_saved", "密码修改成功"],
]);

const env = configure(
    [
        resolve(__dirname, "../../views"),
        resolve(__dirname, "../../client"),
    ],
    {
        noCache: process.env.NODE_ENV == "development",
        watch: process.env.NODE_ENV == "development",
    },
);

env.addFilter("toCurrency", function(num: number) {
    return numeral(num).format("0,0.00");
});

env.addFilter("localize", function(key: string) {
    if (localized.has(key)) {
        return localized.get(key);
    }

    return key;
});

env.addFilter("toCST", (str: string) => {
    try {
        return DateTime
            .fromISO(str)
            .setZone("Asia/Shanghai")
            .toFormat("yyyy-LL-dd HH:mm:ss (ZZ z)");
    } catch (e) {
        return str;
    }
});

env.addFilter("showAlert", (key: string) => {
    if (alertMsg.has(key)) {
        return alertMsg.get(key);
    }

    return key;
});

function promisifiedRender(name: string, context?: object): Promise<string> {
    return new Promise((resolve, reject) => {
        render(name, context, (err, res) => {
            if (err) {
                reject(err);
                return;
            }

            if (res == null) {
                reject("no rendered result")
                return;
            }

            resolve(res);
        });
    });
}

export default promisifiedRender;

