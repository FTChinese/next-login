const Router = require('koa-router');
const debug = require("debug")('user:name');
const render = require('../../util/render');
const {
  sitemap
} = require("../../model/sitemap");
const {
  isAPIError,
  buildErrMsg,
  buildApiError
} = require("../../lib/response");
const {
  ProfileValidator
} = require("../../lib/validate");
const {
  FtcUser,
} = require("../../model/request");

const router = new Router();

/**
 * @description Show page to update display name
 * /user/profile/display-name
 */
router.get("/", async (ctx) => {
  const userId = ctx.session.user.id;

  const user = new FtcUser(userId);

  const profile = await user.fetchProfile();

  ctx.state.profile = profile;
  ctx.body = await render("profile/display-name.html", ctx.state);
});

/**
 * @description Update display name
 * /user/profile/display-name
 */
router.post('/', async (ctx, next) => {

  /**
   * @todo Change to ProfileValidator
   * @type {{userName: string}}
   */
  const profile = ctx.request.body.profile;
  const {
    result,
    errors
  } = new ProfileValidator(profile)
    .displayName()
    .end();


  if (errors) {
    ctx.state.errors = errors;
    ctx.state.profile = profile;

    return await next();
  }

  try {
    await new FtcUser(ctx.session.user.id)
      .updateDisplayName(result);

    ctx.session.alert = {
      key: "saved"
    };

    return ctx.redirect(sitemap.profile);

  } catch (e) {
    ctx.state.profile = profile;

    if (!isAPIError(e)) {
      debug("%O", e);
      ctx.state.errors = buildErrMsg(e);

      return await next();
    }

    const body = e.response.body;
    debug("API error response: %O", body);

    ctx.state.errors = buildApiError(body);

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render("profile/display-name.html", ctx.state);
});

module.exports = router.routes();
