const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:name');

const { nextApi } = require("../../lib/endpoints")
const sitemap = require("../../lib/sitemap");
const { isAPIError, buildApiError } = require("../../lib/response");
const { AccountValidtor } = require("../../lib/validate");

const router = new Router();

// Submit new email
router.post('/', async (ctx) => {

  /**
   * @type {{currentEmail: string, email: string}}
   */
  const account = ctx.request.body.account;

  const { result, errors } = new AccountValidtor(account)
    .validateEmail()
    .validateEmailUpdate();

  if (errors) {
    ctx.session.errors = errors;
    ctx.session.account = account;

    return ctx.redirect(sitemap.account);
  }

  try {
    const userId = ctx.session.user.id;

    const resp = await request.patch(nextApi.email)
      .set('X-User-Id', userId)
      .send({email: result.email});
    
    ctx.session.alert = {
      done: "email",
    };

    return ctx.redirect(sitemap.account);
  } catch (e) {

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.session.errors = {
        server: e.message
      };

      ctx.session.account = account;

      return ctx.redirect(sitemap.account);
    }
    
    /**
     * @type {{message: string, error: Object}}
     */
    const body = e.response.body;

    ctx.session.errors = buildApiError(body);

    return ctx.redirect(sitemap.account);
  }
});

module.exports = router.routes();