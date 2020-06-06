import { resolve } from "path";
import { configure, render } from "nunjucks";
import makrdown from "nunjucks-markdown";
import marked from "marked";
import { formatMoney, iso8601ToCST } from "./formatter";

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

env.addFilter("toCST", (str: string) => {
  return iso8601ToCST(str);
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
