const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:name');

const {
  nextApi
} = require("../../model/endpoints")
const {
  sitemap
} = require("../../model/sitemap");
const {
  isAPIError,
  buildErrMsg
} = require("../../lib/response");
const {
  AccountValidtor
} = require("../../lib/validate");

const router = new Router();

router.post('/', async (ctx) => {

  /**
   * @type {{userName: string}}
   */
  const profile = ctx.request.body.profile;
  const {
    result,
    errors
  } = new AccountValidtor(profile)
    .validateName()
    .end();


  if (errors) {
    ctx.session.errors = errors;
    ctx.session.profile = profile;

    return ctx.redirect(sitemap.profile);
  }

  try {

    const userId = ctx.session.user.id;

    await request.patch(nextApi.name)
      .set('X-User-Id', userId)
      .send(result);

    ctx.session.alert = {
      key: "saved"
    };

    // Update session data
    ctx.session.user.name = result.userName;

    return ctx.redirect(sitemap.profile);

  } catch (e) {
    ctx.session.profile = profile;

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.session.errors = buildErrMsg(e);

      return ctx.redirect(sitemap.profile);
    }

    /**
     * 400: {server: "Problems parsing JSON"}
     * 422: {userName: userName_missing_field}
     * {userName: userName_invalid}
     * {userName: userName_already_exists}
     */
    ctx.session.apiErr = e.response.body;

    return ctx.redirect(sitemap.profile);
  }
});

module.exports = router.routes();
