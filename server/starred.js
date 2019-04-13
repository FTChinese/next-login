const Router = require('koa-router');
const debug = require('debug')('user:starred');

const render = require('../util/render');
const {
  sitemap
} = require("../lib/sitemap");
const {
  isAPIError,
  buildApiError,
  buildErrMsg
} = require("../lib/response");
const {
  paging
} = require("./middleware");
const FtcUser = require("../lib/ftc-user");
const Account = require("../lib/account");

const router = new Router();

/**
 * @description Show the list of starred articles.
 * /starred?page=<number>
 */
router.get("/", 
  paging(10), 
  async (ctx, next) => {
    /**
     * @type {Account}
     */
    const userAccount = ctx.state.user;
    if (userAccount.isWxOnly()) {
      return await next();
    }

    const ftcUser = new FtcUser(ctx.session.user.id);

    const articles = await ftcUser
      .starredArticles(ctx.state.paging);

    ctx.state.articles = articles;
    ctx.state.paging.listSize = articles.length;

    return await next();
  },

  async (ctx) => {
    ctx.body = await render("starred.html", ctx.state);
  }
);

router.post("/:id/delete", async (ctx, next) => {
  const id = ctx.params.id;
  /**
   * @type {Account}
   */
  const account = ctx.state.user;

  try {
    await account
      .unstarArticle(id)

    return ctx.redirect(sitemap.starred);
  } catch (e) {
    if (!isAPIError(e)) {
      /**
       * @type {{message: string}}
       */
      ctx.session.errors = buildErrMsg(e);

      return ctx.redirect(sitemap.starred);
    }

    ctx.session.errors = buildApiError(e.response.body);
    ctx.redirect(sitemap.starred);
  }
});

module.exports = router.routes();
