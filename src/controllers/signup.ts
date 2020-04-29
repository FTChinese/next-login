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
import { SignUpPage, SignUpBuilder, SignUpData } from "../pages/signup";

const router = new Router();

/**
 * @description Show signup page.
 */
router.get("/", async (ctx, next) => {
  const uiData = new SignUpPage(SignUpBuilder.default());

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

  const suBuilder = new SignUpBuilder(formData);
  const isValid = await suBuilder.validate();
  if (!isValid) {
    const uiData = new SignUpPage(suBuilder);
    Object.assign(ctx.state, uiData);
    return await next();
  }

  const account = await suBuilder.create(headers);
  if (!account) {
    const uiData = new SignUpPage(suBuilder);

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
