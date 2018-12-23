const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:password');

const { nextApi } = require("../../lib/endpoints")
const sitemap = require("../../lib/sitemap");
const { isAPIError, buildApiError } = require("../../lib/response");
const { AccountValidtor } = require("../../lib/validate");

const router = new Router();

// Submit new password
router.post('/', async (ctx, next) => {
  const account = ctx.body.request;

  const { result, errors } = new AccountValidtor(account)
    .validatePassword()
    .confirmPassword()
    .validateEmailUpdate();

  if (errors) {
    ctx.session.errors = errors;

    return ctx.redirect(sitemap.account);
  }

  try {
    const userId = ctx.session.user.id;

    await request.patch(endpoints.password)
      .set('X-User-Id', userId)
      .send(result);

    ctx.session.alert = {
      done: "password_saved"
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