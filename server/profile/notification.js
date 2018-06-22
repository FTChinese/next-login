const Router = require('koa-router');
const request = require('superagent');

const schema = require('../schema');

const debug = require('../../utils/debug')('user:account');
const render = require('../../utils/render');
const endpoints = require('../../utils/endpoints');
const {processJoiError, processApiError, isSuperAgentError} = require('../../utils/errors');

const router = new Router();

router.get('/', async (ctx, next) => {

  const resp = await request.get(endpoints.profile)
    .set('X-User-Id', ctx.session.user.id)

  /**
   * @type {Profile}
   */
  const profile = resp.body;
  console.log('User account: %o', resp.body);

  ctx.state.letter = profile.newsletter;

  ctx.body = await render('profile/notification.html', ctx.state);
});

router.post('/', async (ctx, next) => {

  const result = schema.letter.validate(ctx.request.body.letter);

  if (result.error) {
    const errors = processJoiError(result.error);
    ctx.session.errors = errors;
    return ctx.redirect(ctx.path);
  }
  try {

    const resp = await request.patch(endpoints.newsletter)
      .set('X-User-Id', ctx.session.user.id)
      .send(letter);
    
    ctx.session.alert = {
      saved: true
    };

    return ctx.redirect(ctx.path);
  } catch (e) {
    const errors = processApiError(e)
    ctx.session.errors = errors;

    return ctx.redirect(ctx.path);
  }
});

module.exports = router.routes();