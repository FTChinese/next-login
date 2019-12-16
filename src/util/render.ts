import { resolve } from "path";
import { configure, render } from "nunjucks";
import markdown from "nunjucks-markdown";
import marked from "marked";

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

marked.setOptions({
    gfm: true,
    breaks: true,
});
  
markdown.register(env, marked);

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

