import { Middleware } from "koa";
import { Session } from "koa-session";
import { Paging } from "../models/pagination";
import { entranceMap, profileMap } from "../config/sitemap";
import render from "../util/render";
import { HeaderApp } from "../models/header";
import { LayoutBuilder } from "../pages/layout";
import { build } from "@hapi/joi";
const pkg = require("../../package.json");

function isLoggedIn(session?: Session): Boolean {
  if (session == null) {
    return false;
  }

  if (session.isNew || !session.user) {
    return false;
  }

  return true;
}

export function baseLayout(): Middleware {
  return async (ctx, next) => {
    Object.assign(ctx.state, LayoutBuilder.base().build());

    await next();
  };
}

export function contentLayout(): Middleware {
  return async (ctx, next) => {
    Object.assign(
      ctx.state, 
      LayoutBuilder.content(ctx.state.user, ctx.path).build(),
    );

    await next();
  };
}

export function androidLayout(): Middleware {
  return async (ctx, next) => {
    Object.assign(
      ctx.state, 
      LayoutBuilder.android().build(),
    );

    await next();
  }
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
export function authGuard(): Middleware {
  return async (ctx, next) => {
    if (ctx.path == "/favicon.ico") return;

    // @ts-ignore
    if (isLoggedIn(ctx.session)) {
      // @ts-ignore
      ctx.state.user = ctx.session.user;

      return await next();
    }

    ctx.state.user = null;

    console.log('not logged in. redirect');

    ctx.redirect(entranceMap.login);
  };
}

/**
 * noAuthGuard ensures a path is only accessible when user is not logged in.
 */
export function noAuthGuard(): Middleware {
  return async (ctx, next) => {
    if (ctx.path == '/favicon.ico') return;

    // @ts-ignore
    if (isLoggedIn(ctx.session)) {
      return ctx.redirect(profileMap.base);
    }

    await next();
  }
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
    const headers: HeaderApp = {
      "X-Client-Type": "web",
      "X-Client-Version": pkg.version,
      "X-User-Ip": ctx.ip,
      "X-User-Agent": ctx.header["user-agent"],
    };

    ctx.state.appHeaders = headers;

    await next();
  };
}
