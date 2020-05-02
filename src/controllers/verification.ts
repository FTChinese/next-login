import Router from "koa-router";
import render from "../util/render";
import {  
    Account,
} from "../models/reader";
import { EmailVerifiedBuilder } from "../pages/email-verified";

const router = new Router();

router.get("/email/:token", async (ctx, next) => {
    const token: string = ctx.params.token;
    const account: Account | undefined = ctx.state.user;

    const builder = new EmailVerifiedBuilder(account);
    const ok = await builder.verify(token);

    if (ok && account) {
        // @ts-ignore
        ctx.session.user = account.withVerified();
    }

    const uiData = builder.build

    Object.assign(ctx.state, uiData);

    ctx.body = await render("verification/email.html", ctx.state);
});

export default router.routes();
