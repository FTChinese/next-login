import Router from "koa-router";
import render from "../util/render";
import {
    paging,
} from "./middleware";
import {
    Account,
} from "../models/reader";
import {
    articleViewModel,
} from "../viewmodels/article-viewmodel";
import { starredMap } from "../config/sitemap";

const router = new Router();

router.get("/", paging(10), async (ctx, next) => {
    const account: Account = ctx.state.user;

    if (account.isWxOnly()) {
        return await next();
    }

    if (ctx.session.error) {
        const uiData = await articleViewModel.buildUI(
            account,
            ctx.state.paging,
            ctx.session.error,
        );

        Object.assign(ctx.state, uiData);

        return await next();
    }

    const uiData = await articleViewModel.buildUI(account, ctx.state.paging);

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

    const id: string = ctx.params.id;

    const { success, errResp } = await articleViewModel.delete(account, id);

    if (errResp) {
        ctx.session.error = errResp.message;
    }

    ctx.redirect(starredMap.base)
});

export default router.routes();
