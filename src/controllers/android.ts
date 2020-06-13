import Router from "koa-router";
import render from "../util/render";
import { paging } from "./middleware";
import { AndroidPageBuilder } from "../pages/android-page";
const router = new Router();

router.get("/latest", async (ctx, next) => {
  const builder = new AndroidPageBuilder();
  
  const uiData = await builder.latest();

  Object.assign(ctx.state, uiData);

  ctx.body = await render("android.html", ctx.state);
});

router.get("/releases", paging(10), async (ctx, next) => {
  const builder = new AndroidPageBuilder();

  const uiData = await builder.allReleases(ctx.state.paging);

  Object.assign(ctx.state, uiData);

  ctx.body = await render("android.html", ctx.state);
});

export default router.routes();
