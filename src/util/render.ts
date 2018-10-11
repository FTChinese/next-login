import {resolve} from "path";
import nunjucks from "nunjucks";
import {promisify} from "util";

nunjucks.configure(
    [
        resolve(__dirname, "../../view"),
        resolve(__dirname, "../../view")
    ],
    {
        noCache: process.env.NODE_DEV == "development",
        watch: false
    }
)

export const render = promisify(nunjucks.render);