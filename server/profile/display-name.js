const Router = require('koa-router');
const debug = require("debug")('user:name');
const render = require('../../util/render');
const {
  sitemap
} = require("../../lib/sitemap");
const {
  ClientError,
} = require("../../lib/response");
const FtcUser = require("../../lib/ftc-user");
const {
  validateUserName,
} = require("../schema");

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

  const { value, errors } = validateUserName(profile.userName);

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.profile = value;

    return await next();
  }

  try {
    await new FtcUser(ctx.session.user.id)
      .updateDisplayName(value);

    ctx.session.alert = {
      key: "saved"
    };

    return ctx.redirect(sitemap.profile);

  } catch (e) {
    ctx.state.profile = value;

    const clientErr = new ClientError(e);
    if (!clientErr.isFromAPI()) {
      throw e;
    }

    ctx.state.errors = clientErr.buildApiError();

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render("profile/display-name.html", ctx.state);
});

module.exports = router.routes();
