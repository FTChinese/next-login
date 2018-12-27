const request = require('superagent');
const Router = require('koa-router');
const debug = require('debug')('user:starred');

const render = require('../util/render');
const { nextApi } = require("../lib/endpoints");
const sitemap = require("../lib/sitemap");
const { errMessage, isAPIError, buildApiError, buildErrMsg } = require("../lib/response");

const router = new Router();

// Show the list of starred articles.
// /starred?page=<number>
router.get("/", async (ctx, next) => {
  let page = ctx.request.query.page;
  page = Number.parseInt(page, 10)
  if (!page) {
    page = 1;
  }

  const prevPage = page - 1;
  let nextPage = page + 1;

  const userId = ctx.session.user.id;
  const resp = await request.get(`${nextApi.starred}?page=${page}`)
    .set("X-User-Id", userId);

  const articles = resp.body;
  if (articles.length <= 20) {
    nextPage = 0
  }

  ctx.state.articles = articles
  ctx.state.page = {
    prev: prevPage,
    next: nextPage,
  };

  ctx.body = await render("starred.html", ctx.state);
});

module.exports = router.routes();