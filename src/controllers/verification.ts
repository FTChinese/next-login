import Router from "koa-router";
import render from "../util/render";
import {  
    Account,
} from "../models/reader";
import { vrfViewModel } from "../viewmodels/vrf-viewmodel";

const router = new Router();

router.get("/email/:token", async (ctx, next) => {
    const token: string = ctx.param.token;
    const account: Account = ctx.session.user;

    const { success, errResp } = await vrfViewModel.verifyEmail(token);

    if (success) {
        ctx.session.user = account.withVerified();
    }

    const uiData = vrfViewModel.buildUI(
        { success, errResp },
        !!account,
    );

    Object.assign(ctx.state, uiData);

    ctx.body = await render("verification/email.html", ctx.state);
});

export default router.routes();
