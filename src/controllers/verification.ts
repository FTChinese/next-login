import Router from "koa-router";
import render from "../util/render";
import {  
    Account, accountVerified,
} from "../models/account";
import { EmailVerifiedBuilder } from "../pages/email-verified";

const router = new Router();

/**
 * Verify email.
 * /verify/email/<token>
 */
router.get("/email/:token", async (ctx, next) => {
    const token: string = ctx.params.token;
    const account: Account | undefined = ctx.state.user;

    const builder = new EmailVerifiedBuilder(account);
    const ok = await builder.verify(token);

    if (ok && account) {
        // @ts-ignore
        ctx.session.user = accountVerified(account);
    }

    const uiData = builder.build

    Object.assign(ctx.state, uiData);

    ctx.body = await render("verification/email.html", ctx.state);
});

export default router.routes();
