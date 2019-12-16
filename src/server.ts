import "reflect-metadata";
import {
    viper,
} from "./config/viper";

const config = viper.setConfigPath(process.env.HOME)
    .setConfigName("config/api.toml")
    .readInConfig()
    .getConfig();

console.log(config);

import { resolve } from "path";
import Koa from "koa";
import Router from "koa-router";
import logger from "koa-logger";
import bodyParser from "koa-bodyparser";
import session from "koa-session";
import serve from "koa-static";
const pkg = require("../package.json");

import {
    env,
    checkSession,
    nav,
    handleError,
} from "./controllers/middleware";
import login from "./controllers/login";
import oauth2 from "./controllers/oauth2";
import signUp from "./controllers/signup";
import forgotPassword from "./controllers/forgot-password";
import profile from "./controllers/profile";
import account from "./controllers/account";
import verification from "./controllers/verification";
import subscription from "./controllers/subscription";
import starred from "./controllers/starred";
import android from "./controllers/android";

import { 
    entranceMap,
} from "./config/sitemap";

const app = new Koa();
const router = new Router();

app.proxy = true;
app.keys = [config.koa_session.next_user];

if (process.env.NODE_ENV != "production") {
    app.use(
        serve(
            resolve(__dirname, "../node_modules")
        )
    );
    app.use(
        serve(
            resolve(__dirname, "../build/dev")
        )
    );
}

app.use(env());
app.use(nav());
app.use(logger());
app.use(session({
    key: "_ftc:next",
    renew: true,
}, app));
app.use(bodyParser());
app.use(handleError());

router.get("/__version", async (ctx) => {
    console.log("Version");

    ctx.body = {
        "name": pkg.name,
        "version": pkg.version,
    };
});

router.use("/login", checkSession(false), login);
router.use("/signup", checkSession(false), signUp);
router.get("/logout", checkSession(false), async (ctx, next) => {
    ctx.session = null;
    ctx.redirect(entranceMap.login);
    return;
});
router.use("/verify", checkSession(false), verification);
router.use("/password-reset", checkSession(false), forgotPassword);
router.use("/oauth2", oauth2);
router.use("/profile", checkSession(), profile);
router.use("/account", checkSession(), account);
router.use('/subscription', checkSession(), subscription);
router.use("/starred", checkSession(), starred);
router.use("/android", android);

app.use(router.routes());

console.log(router.stack.map(layer => layer.path));

async function bootUp(app: Koa, port: number, appName: string = pkg.name) {
    console.log(`Booting ${appName}`);

    const server = app.listen(port);

    server.on("error", err => {
        console.error("Server error: %O", err);
    });

    server.on("listening", () => {
        console.log("%s running on port %s. NODE_ENV: %s", appName, server.address(), process.env.NODE_ENV);
    });
}

bootUp(app, 4300)
    .catch(err => {
        console.error("Boot error: %O", err);
    });
