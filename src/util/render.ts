import { resolve } from "path";
import { configure, render } from "nunjucks";
// @ts-ignore
import makrdown from "nunjucks-markdown";
import marked from "marked";
import { formatMoney, iso8601ToCST } from "./formatter";
import { Tier, Cycle, PaymentMethod } from "../models/enums";
import { tiersCN, cyclesCN, paymentMethodsCN, currencySymbols } from "../models/localization";
import { search } from "superagent";

const env = configure(
  [resolve(__dirname, "../../views"), resolve(__dirname, "../../client")],
  {
    noCache: process.env.NODE_ENV == "development",
    watch: process.env.NODE_ENV == "development",
  }
);

env.addFilter("toCurrency", function(num: number) {
  return formatMoney(num);
});

env.addFilter("toCST", (str: string, zone: boolean) => {
  return iso8601ToCST(str, { withZone: zone});
});

env.addFilter("localizeTier", (tier: Tier) => {
  return tiersCN[tier];
});

env.addFilter("localizeCycle", (cycle: Cycle) => {
  return cyclesCN[cycle];
});

env.addFilter("localizePayMethod", (method: PaymentMethod) => {
  return paymentMethodsCN[method];
});

env.addFilter("currency", (c: string) => {
  return currencySymbols[c];
});

env.addFilter('split', (str: string, separator: string) => {
  if (!separator) {
    separator = '\n';
  }

  if (!str) {
    return [];
  }
  
  return str.split(separator);
});

marked.setOptions({
  gfm: true,
  breaks: true,
})

makrdown.register(env, marked);

function promisifiedRender(name: string, context?: object): Promise<string> {
  return new Promise((resolve, reject) => {
    render(name, context, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      if (res == null) {
        reject("no rendered result");
        return;
      }

      resolve(res);
    });
  });
}

export default promisifiedRender;
