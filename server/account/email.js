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

  const result = schema.changeEmail.validate(ctx.request.body.account);
  if (result.error) {
    const errors = processJoiError(result.error);

    ctx.session.errors = errors;

    return ctx.redirect(sitemap.account);
  }

  /**
   * @type {{oldEmail: string, email: string}}
   */
  const account = result.value;

  // If email is not changed, do nothing.
  if (account.oldEmail === account.email) {
    debug.info('Email is not altered.');
    return ctx.redirect(ctx.path);
  }

  try {
    const userId = ctx.session.user.id;

    const resp = await request.patch(nextApi.email)
      .set('X-User-Id', userId)
      .send({email: account.email});

    // If resp.status === 204, the email is not altered
    // If email is actually changed, updated user data will be sent back.
    if (200 === resp.status) {
      ctx.session.alert = {
        done: "email",
      };
    }
    
    return ctx.redirect(sitemap.account);
  } catch (e) {

    const errors = processApiError(e);
    ctx.session.errors = errors;

    return ctx.redirect(sitemap.account);
  }
});

module.exports = router.routes();