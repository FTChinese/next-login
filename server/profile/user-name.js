const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:name');

const { nextApi } = require("../../lib/endpoints")
const sitemap = require("../../lib/sitemap");
const { isAPIError, buildApiError } = require("../../lib/response");
const { ProfileValidator } = require("../../lib/validate");

const router = new Router();

router.post('/', async (ctx) => {

  /**
   * @type {{userName: string}}
   */
  const profile = ctx.request.body.profile;
  const { result, errors } = new ProfileValidator(profile)
    .userName()
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
      done: "name_saved"
    };

    // Update session data
    ctx.session.user.name = result.userName;
    
    return ctx.redirect(sitemap.profile);

  } catch (e) {
    ctx.session.profile = profile;

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.session.errors = {
        server: e.message,
      };

      return ctx.redirect(sitemap.profile);
    }

    /**
     * @type {{message: string, error: Object}}
     */
    const body = e.response.body;

    ctx.session.errors = buildApiError(body);

    return ctx.redirect(sitemap.profile);
  }
});

module.exports = router.routes();