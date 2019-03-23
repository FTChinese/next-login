const request = require('superagent');
const Router = require('koa-router');
const debug = require('debug')('user:starred');

const render = require('../util/render');
const {
  nextApi
} = require("../model/endpoints");
const {
  sitemap
} = require("../model/sitemap");
const {
  KEY_USER_ID,
} = require("../lib/request");
const {
  isAPIError,
  buildApiError,
  buildErrMsg
} = require("../lib/response");
const {
  paging
} = require("./middleware");

const router = new Router();

// Show the list of starred articles.
// /starred?page=<number>
router.get("/", paging(10), async (ctx, next) => {

  const userId = ctx.session.user.id;
  const resp = await request.get(nextApi.starred)
    .query(ctx.state.paging)
    .set(KEY_USER_ID, userId);

  const articles = resp.body;

  ctx.state.articles = articles;
  ctx.state.paging.listSize = articles.length;

  ctx.body = await render("starred.html", ctx.state);
});

router.post("/:id/delete", async (ctx, next) => {
  const id = ctx.params.id;
  debug("Delete article %s", id);

  try {
    const userId = ctx.session.user.id;
    await request.delete(`${nextApi.starred}/${id}`)
      .set("X-User-Id", userId);

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
