const Router = require('koa-router');
const debug = require("debug")('user:profile');
const render = require('../../util/render');

const {
  sitemap
} = require("../../lib/sitemap");
const {
  ClientError,
} = require("../../lib/response");
const FtcUser = require("../../lib/ftc-user");
const {
  validateMobile,
} = require("../schema");

const router = new Router();

router.get("/", async (ctx) => {
  const userId = ctx.session.user.id;

  const user = new FtcUser(userId);

  const profile = await user.fetchProfile();

  ctx.state.profile = profile;
  ctx.body = await render("profile/mobile.html", ctx.state);
});

router.post('/', async (ctx, next) => {

  /**
   * @type {{mobile: string}}
   */
  const profile = ctx.request.body.profile;

  const { value, errors } = validateMobile(profile.mobile);

  if (errors) {
    ctx.state.errors = errors;
    ctx.state.profile = value;

    return await next();
  }

  try {

    await new FtcUser(ctx.session.user.id)
      .updateMobile(value);

    // Tell UI data is saved.
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

    ctx.state.errors = clientErr.buildAPIError();

    return await next();
  }
}, async (ctx) => {
  ctx.body = await render("profile/mobile.html", ctx.state);
});

module.exports = router.routes();
