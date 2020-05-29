import Router from "koa-router";
import render from "../util/render";
import {
  collectAppHeaders,
} from "./middleware";
import {
  IHeaderApp,
} from "../models/header";
import {
  profileMap
} from "../config/sitemap";
import { IOAuthSession, oauthServer } from "../models/ftc-oauth";
import { SignUpBuilder, SignUpData } from "../pages/signup-page";

const router = new Router();

/**
 * @description Show signup page.
 */
router.get("/", async (ctx, next) => {
  const uiData = (new SignUpBuilder()).build();

  Object.assign(ctx.state, uiData);

  ctx.body = await render("signup.html", ctx.state);
});

/**
 * @description Handle signup data.
 */
router.post("/", collectAppHeaders(), async (ctx, next) => {
  const formData: SignUpData | undefined = ctx.request.body.credentials;

  if (!formData) {
    throw new Error("form data not found");
  }

  const headers: IHeaderApp = ctx.state.appHeaders;

  const builder = new SignUpBuilder();
  const isValid = await builder.validate(formData);
  if (!isValid) {
    const uiData = builder.build();
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const account = await builder.create(headers);
  if (!account) {
    const uiData = builder.build();

    Object.assign(ctx.state, uiData);

    return await next();
  }

  // @ts-ignore
  ctx.session.user = success;

  // @ts-ignore
  if (ctx.session.oauth) {
    // @ts-ignore
    const oauthSession: IOAuthSession = ctx.session.oauth;

    ctx.redirect(oauthServer.buildAuthorizeUrl(oauthSession));

    // @ts-ignore
    delete ctx.session.oauth;

    return;
  }
  return ctx.redirect(profileMap.base);

}, async (ctx, next) => {
  ctx.body = await render('signup.html', ctx.state);
});

export default router.routes();
