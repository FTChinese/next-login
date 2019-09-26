import Router from "koa-router";
import render from "../util/render";
import {
    appHeader,
} from "./middleware";
import { 
    ICredentials, IAppHeader 
} from "../models/reader";
import { 
    profileMap 
} from "../config/sitemap";

const router = new Router();

router.get("/", async (ctx, next) => {
    ctx.body = await render("account/account.html", ctx.state);
});

router.get("/email", async (ctx, next) => {
    ctx.body = await render("account/update-email.html", ctx.state);
});

router.post("/email", async (ctx, next) => {
    ctx.body = await render("account/update-email.html", ctx.state);
});

router.get("/password", async (ctx, next) => {

});

router.post("/password", async (ctx, next) => {

});

router.post("/request-verification", async (ctx, next) => {

});

router.get("/link/email", async (ctx, next) => {
    ctx.body = await render("account/email-exists.html", ctx.state);
});

router.post("/link/email", async (ctx, next) => {

});

router.get("/link/login", async (ctx, next) => {
    ctx.body = await render("account/login.html", ctx.state);
});

router.post("/link/login", async (ctx, next) => {

});

router.get("/link/merge", async (ctx, next) => {
    ctx.body = await render("account/merge.html", ctx.state);
});

router.post("/link/merge", async (ctx, next) => {

});

router.get("/link/signup", async (ctx, next) => {
    ctx.body = await render("account/signup.html", ctx.state);
});

router.post("/link/signup", async (ctx, next) => {

});

export default router.routes();
