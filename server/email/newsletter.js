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



module.exports = router.routes();