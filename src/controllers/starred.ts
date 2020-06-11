import Router from "koa-router";
import debug from "debug";
import render from "../util/render";
import {
  paging,
} from "./middleware";
import {
  Account, isAccountWxOnly,
} from "../models/account";
import { starredMap } from "../config/sitemap";
import { StarredPageBuilder } from "../pages/starred-page";

const log = debug("user:starred");
const router = new Router();

router.get("/", paging(10), async (ctx, next) => {
  const account: Account = ctx.state.user;
  // @ts-ignore
  const redirectErrMsg: string | undefined = ctx.session.error;

  log("Redirect error: %O", redirectErrMsg);

  const builder = new StarredPageBuilder(account);

  if (account.id) {
    await builder.load(ctx.state.paging);
  }
  
  const uiData = builder.buildUI(redirectErrMsg);

  Object.assign(ctx.state, uiData);

  ctx.body = await render("starred.html", ctx.state);
});

router.post("/:id/delete", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (isAccountWxOnly(account)) {
    ctx.status = 404;
    return;
  }

  const builder = new StarredPageBuilder(account);

  const id: string = ctx.params.id;

  const errResp = await builder.delete(id);

  if (errResp) {
    // @ts-ignore
    ctx.session.error = errResp.message;
  }

  ctx.redirect(starredMap.base)
});

export default router.routes();
