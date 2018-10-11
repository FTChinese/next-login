import { resolve } from "path";
import dotenv from "dotenv";

const result = dotenv.config({
    path: resolve(process.env.HOME, ".ftc/.env")
});

if (result.error) {
    throw result.error;
}

import Koa from "koa";
import Router from "koa-router"
import logger from "koa-logger";
import bodyParser from "koa-bodyparser";
import session from "koa-session";
import serve from "koa-static";

import boot from "./util/boot";

const app = new Koa();
const router = new Router({
    prefix: "/user"
});

const isProduction = process.env.NODE_ENV === "production";

app.proxy = true;

app.keys = [
    process.env.SESSION_KEY1,
    process.env.SESSION_KEY2
];

app.use(logger());

if (!isProduction) {
    app.use(
        serve(resolve(process.cwd(), "node_modules"))
    );
    app.use(
        serve(resolve(process.cwd(), "client"))
    )
}

boot(app)
    .catch(err => {
        console.log("Bootup error: %o", err);
    });

