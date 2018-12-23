const request = require('superagent');
const Router = require('koa-router');
const debug = require("debug")('user:verification');
const { nextApi } = require("../lib/endpoints");
const { buildApiError } = require("../lib/response");

const render = require('../util/render');

const router = new Router();

// Confirm verfication token
router.get('/email/:token', async (ctx) => {
  const token = ctx.params.token;

  try {
    const resp = await request
      .put(`${nextApi.verifyEmail}/${token}`);

    // Update verification status if session exists
    if (ctx.session.user) {
      debug.info('Update session data after email verified');
      ctx.session.user.vrf = true;
    }

    ctx.state.alert = {
      done: "email_verified"
    };

    ctx.body = await render('email-verified.html', ctx.state);

  } catch (e) {
    /**
     * @type {{message: string, error: Object}}
     */
    const body = e.response.body;

    switch (e.status) {
      case 404:
        ctx.state.errors = {

        }
        break;
      default:
        ctx.state.errors = buildApiError(body);
        break;
    }

    ctx.body = await render('email-verified');
  }
});

// You may add other routers to verify tools like mobile phone, etc..

module.exports = router.routes();