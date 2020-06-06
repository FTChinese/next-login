import Router from "koa-router";
import render from "../util/render";
import {
  paging,
} from "./middleware";
import {
  Account,
} from "../models/reader";
import { starredMap } from "../config/sitemap";
import { StarredPageBuilder } from "./starred-page";

const router = new Router();

router.get("/", paging(10), async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (account.isWxOnly()) {
    return await next();
  }

  const builder = new StarredPageBuilder(account);
  // @ts-ignore
  if (ctx.session.error) {
    const uiData = await builder.buildUI(
      ctx.state.paging,
      // @ts-ignore
      ctx.session.error,
    );

    Object.assign(ctx.state, uiData);

    return await next();
  }

  const uiData = await builder.buildUI(ctx.state.paging);

  Object.assign(ctx.state, uiData);

  return await next();
}, async (ctx, next) => {
  ctx.body = await render("starred.html", ctx.state);
});

router.post("/:id/delete", async (ctx, next) => {
  const account: Account = ctx.state.user;

  if (account.isWxOnly()) {
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
