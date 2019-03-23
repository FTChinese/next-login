const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:profile');

const {
  nextApi
} = require("../../model/endpoints")
const sitemap = require("../../model/sitemap");
const {
  isAPIError,
  buildApiError
} = require("../../lib/response");
const {
  ProfileValidator
} = require("../../lib/validate");

const router = new Router();

router.post('/', async (ctx) => {

  /**
   * @type {{mobile: string}}
   */
  const profile = ctx.request.body.profile;
  const {
    result,
    errors
  } = new ProfileValidator(profile)
    .mobile()
    .end();


  if (errors) {
    ctx.session.errors = errors;
    ctx.session.profile = profile;

    return ctx.redirect(sitemap.profile);
  }

  try {

    const userId = ctx.session.user.id;

    await request.patch(nextApi.mobile)
      .set('X-User-Id', userId)
      .send(result);

    // Tell UI data is saved.
    ctx.session.alert = {
      key: "saved"
    };

    return ctx.redirect(sitemap.profile);

  } catch (e) {
    ctx.session.profile = profile;

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.session.errors = {
        message: e.message,
      };

      return ctx.redirect(sitemap.profile);
    }

    /**
     * @type {{message: string, error: Object}}
     */
    ctx.session.apiErr = e.response.body;

    return ctx.redirect(sitemap.profile);
  }
});

module.exports = router.routes();
