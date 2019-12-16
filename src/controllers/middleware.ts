import debug from "debug";
import { 
    Middleware,
} from "koa";
import { 
    Session
} from "koa-session"
import { 
    isProduction 
} from "../config/viper";
import {
    matrix,
} from "../models/footer";
import {
    sidebar,
} from "../models/nav";
import {
    Paging,
} from "../models/pagination";
import {
    accountSerializer,
} from "../models/reader";
import {
    entranceMap, androidMap,
} from "../config/sitemap";
import render from "../util/render";
import { IHeaderApp } from "../models/header";
const pkg = require("../../package.json");

// This is used to inject boostrap version into template so that it is easy to keep versions in html consistent with those in package.json.
const bsVersion = pkg.devDependencies.bootstrap.replace("^", "");
const bsNativeVersion = pkg.devDependencies["bootstrap.native"].replace("^", "");

const log = debug("by:middleware");

export function env(): Middleware {
    return async (ctx, next) => {
        ctx.state.env = {
            isProduction,
            year: new Date().getFullYear(),
            footer: matrix,
            version: pkg.version,
            bsVersion,
            bsNativeVersion,
        };

        ctx.state.globalUrl = {
            androidHome: androidMap.latest,
            login: entranceMap.login,
        }

        await next();
    };
} 

export function nav(): Middleware {
    return async (ctx, next) => {
        ctx.state.sideNav = sidebar.map(item => {
            return {
                href: item.href,
                text: item.text,
                desktop: item.desktop,
                active: ctx.path.startsWith(item.href),
            };
        });

        return await next();
    }
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
 */
export function checkSession(redirect: boolean = true): Middleware {
    return async (ctx, next) => {
        if (ctx.path == "/faviocon.ico") return;

        if (isLoggedIn(ctx.session)) {

            ctx.state.user = accountSerializer.parse(ctx.session.user);
            
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
        await next()
      } catch (e) {
        log(e);

        ctx.state.error = e;
  
        ctx.body = await render('error.html', ctx.state);
      }
    }
}

export function noCache(): Middleware {
    return async (ctx, next) => {
        await next();
        ctx.set('Cache-Control', ['no-cache', 'no-store', 'must-revalidte']);
        ctx.set('Pragma', 'no-cache');
    }
}

declare module "koa" {
    interface Context {
        state: {
            appHeaders: IHeaderApp;
        }
    }
}

export function collectAppHeaders(): Middleware {
    return async function(ctx, next) {
        const headers: IHeaderApp = {
            "X-Client-Type": "web",
            "X-Client-Version": pkg.version,
            "X-User-Ip": ctx.ip,
            "X-User-Agent": ctx.header["user-agent"],
        };

        ctx.state.appHeaders = headers;

        await next();
    }
}


