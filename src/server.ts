import "reflect-metadata";
import { viper } from "./config/viper";

const config = viper.getConfig();

import { resolve } from "path";
import Koa from "koa";
import Router from "koa-router";
import logger from "koa-logger";
import bodyParser from "koa-bodyparser";
import session from "koa-session";
import serve from "koa-static";
const pkg = require("../package.json");

import {
  baseLayout,
  contentLayout,
  androidLayout,
  authGuard,
  noAuthGuard,
  handleError,
  noCache,
} from "./controllers/middleware";
import login from "./controllers/login";
import signUp from "./controllers/signup";
import forgotPassword from "./controllers/forgot-password";
import profile from "./controllers/profile";
import account from "./controllers/account";
import verification from "./controllers/verification";
import subscription from "./controllers/subscription";
import starred from "./controllers/starred";
import android from "./controllers/android";

import { entranceMap, profileMap } from "./config/sitemap";

const app = new Koa();
const router = new Router();

app.proxy = true;
app.keys = [config.koa_session.next_user];

if (process.env.NODE_ENV != "production") {
  app.use(serve(resolve(__dirname, "../node_modules")));
  app.use(serve(resolve(__dirname, "../build")));
}

app.use(logger());
app.use(
  session(
    {
      key: "_ftc:next",
      renew: true,
    },
    app
  )
);
app.use(bodyParser());
app.use(noCache());
app.use(handleError());

router.get("/", authGuard(), contentLayout(), async function (ctx, next) {
  ctx.redirect(profileMap.base);
});
router.use("/login", noAuthGuard(), baseLayout(), login);
router.use("/signup", noAuthGuard(), baseLayout(), signUp);
router.get("/logout", authGuard(), contentLayout(), async function (ctx, next) {
  ctx.session = null;
  ctx.redirect(entranceMap.login);
  return;
});
router.use("/verify", baseLayout(), verification);
router.use("/password-reset", baseLayout(), forgotPassword);
router.use("/profile", authGuard(), contentLayout(), profile);
router.use("/account", authGuard(), contentLayout(), account);
router.use("/subscription", authGuard(), contentLayout(), subscription);
router.use("/starred", authGuard(), contentLayout(), starred);
router.use("/android", androidLayout(), android);

app.use(router.routes());

console.log(router.stack.map((layer) => layer.path));

async function bootUp(app: Koa, port: number, appName: string = pkg.name) {
  console.log(`Booting ${appName}`);

  const server = app.listen(port);

  server.on("error", (err) => {
    console.error("Server error: %O", err);
  });

  server.on("listening", () => {
    console.log(
      "%s running on port %s. NODE_ENV: %s",
      appName,
      server.address(),
      process.env.NODE_ENV
    );
  });
}

bootUp(app, 4300).catch((err) => {
  console.error("Boot error: %O", err);
});
