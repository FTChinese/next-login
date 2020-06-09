import debug from "debug";
import { Middleware } from "koa";
import { Session } from "koa-session";
import { Paging } from "../models/pagination";
import { accountSerializer } from "../models/reader";
import { entranceMap, androidMap } from "../config/sitemap";
import render from "../util/render";
import { IHeaderApp } from "../models/header";
import { buildBaseLayoutPage, buildContentPage } from "../pages/layout-page";
const pkg = require("../../package.json");

const log = debug("user:middleware");

export function env(): Middleware {
  return async (ctx, next) => {
    Object.assign(ctx.state, buildBaseLayoutPage());

    ctx.state.globalUrl = {
      androidHome: androidMap.latest,
      login: entranceMap.login,
    };

    await next();
  };
}

function isLoggedIn(session?: Session): Boolean {
  if (session == null) {
    return false;
  }

  if (session.isNew || !session.user) {
    return false;
  }

  return true;
}

/**
 *
 * @description Check session data to see if user logged in.
 * `redirect` is used to prevent recursive redirect.
 * For example, if a non-login user is accessing
 * profile page, this user will be redirected to `/login`, which should not perform redirection to itself.
 * Please pay attention ctx.session.user and ctx.state.user are totally different types,
 * although they have the same object shape.
 */
export function checkSession(redirect: boolean = true): Middleware {
  return async (ctx, next) => {
    if (ctx.path == "/favicon.ico") return;

    if (isLoggedIn(ctx.session)) {
      ctx.state.user = ctx.session.user;

      Object.assign(
        ctx.state, 
        buildContentPage(ctx.state.user, ctx.path)
      );

      return await next();
    }

    ctx.state.user = null;

    if (!redirect) {
      return await next();
    }

    ctx.redirect(entranceMap.login);
  };
}

export function paging(perPage = 20): Middleware {
  return async (ctx, next) => {
    const currentPage: string | undefined = ctx.request.query.page;

    if (!currentPage) {
      ctx.state.paging = new Paging(undefined, perPage);

      return await next();
    }

    const page = Number.parseInt(currentPage, 10);

    ctx.state.paging = new Paging(page, perPage);

    await next();
  };
}

export function handleError(): Middleware {
  return async function (ctx, next) {
    try {
      await next();
    } catch (e) {

      ctx.state.error = e;

      ctx.body = await render("error.html", ctx.state);
    }
  };
}

export function noCache(): Middleware {
  return async (ctx, next) => {
    await next();
    ctx.set("Cache-Control", ["no-cache", "no-store", "must-revalidte"]);
    ctx.set("Pragma", "no-cache");
  };
}

export function collectAppHeaders(): Middleware {
  return async function (ctx, next) {
    const headers: IHeaderApp = {
      "X-Client-Type": "web",
      "X-Client-Version": pkg.version,
      "X-User-Ip": ctx.ip,
      "X-User-Agent": ctx.header["user-agent"],
    };

    ctx.state.appHeaders = headers;

    await next();
  };
}
