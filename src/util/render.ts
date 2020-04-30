import { resolve } from "path";
import { configure, render } from "nunjucks";

configure(
  [resolve(__dirname, "../../views"), resolve(__dirname, "../../client")],
  {
    noCache: process.env.NODE_ENV == "development",
    watch: process.env.NODE_ENV == "development",
  }
);

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
