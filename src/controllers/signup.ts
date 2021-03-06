import Router from "koa-router";
import render from "../util/render";
import {
  collectAppHeaders,
} from "./middleware";
import {
  HeaderApp,
} from "../models/header";
import {
  profileMap
} from "../config/sitemap";
import { SignUpBuilder } from "../pages/signup-page";
import { SignUpForm } from "../models/form-data";

const router = new Router();

/**
 * @description Show signup page.
 */
router.get("/", async (ctx, next) => {
  const uiData = (new SignUpBuilder()).build();

  Object.assign(ctx.state, uiData);

  ctx.body = await render("entrance.html", ctx.state);
});

/**
 * @description Handle signup data.
 */
router.post("/", collectAppHeaders(), async (ctx, next) => {
  const formData: SignUpForm | undefined = ctx.request.body.credentials;

  if (!formData) {
    throw new Error("form data not found");
  }

  const headers: HeaderApp = ctx.state.appHeaders;

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
  ctx.session.user = account;

  return ctx.redirect(profileMap.base);

}, async (ctx, next) => {
  ctx.body = await render('entrance.html', ctx.state);
});

export default router.routes();
