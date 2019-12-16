import Router from "koa-router";
import render from "../util/render";
import { paging } from "./middleware";
import { androidViewModel } from "../viewmodels/android-viewmodel";
const router = new Router();

router.get("/latest", async(ctx, next) => {
    const uiData = await androidViewModel.latest();

    Object.assign(ctx.state, uiData);

    ctx.body = await render("android/latest.html", ctx.state);
});

router.get("/releases", paging(10), async (ctx, next) => {
    const uiData = await androidViewModel.allReleases(ctx.state.paging);

    Object.assign(ctx.state, uiData);

    ctx.body = await render("android/list.html", ctx.state);
});

export default router.routes();
