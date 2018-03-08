const debug = require('debug')('user:password-reset');
const Router = require('koa-router');
const request = require('superagent');
const Kyev = require('keyv');
const Joi = require('joi');
const schema = require('./schema');
const render = require('../utils/render');
const sendEmail = require('../utils/send-email');
const random = require('../utils/random');

const router = new Router();
const keyv = new keyv({
    ttl: 1000 * 60 * 60 * 3
});

router.get('/', async (ctx, next) => {
  ctx.body = await render('password-reset.html', ctx.state);
});

router.get('/:code', async (ctx, next) => {
  // if code is invalid, redirect to `/password-reset`
  // Query database, find out which email this code is linked to.
  const code = ctx.params.code;

  const info = keyv.get(code);
  
  ctx.body = code;
});

router.post('/', async (ctx, next) => {

  /**
   * @type {{email: string}}
   */
  const body = ctx.request.body;

  debug('Body: %O', body);

  try {

    /**
     * @type {{email: string}}
     */
    const validated = await Joi.validate(body, schema.email);
    const email = validated.email;

    debug('Input validated: %O', validated);

    const resp = await request.get(`http://localhost:8000/is-taken?email=${email}`)
      .auth(ctx.accessData.access_token, {type: 'bearer'})

    debug('Get response from api');

    const code = await random();
    const info = await sendEmail({
      address: email,
      code
    });

    keyv.set(code, {
      email,
      name: 'name',
      uuid: 'uuid'
    });

    debug('Email sent: %s', info.messageId);

    ctx.state.emailSent = true;
    ctx.body = await render('password-reset.html', ctx.state);

  } catch (e) {
    const joiErrs = schema.gatherErrors(e);
    if (joiErrs) {
      debug('Joi errors: %O', joiErrs);
      ctx.state.errors = joiErrs;
      return await next();
    }

    if (404 === e.status) {
      debug('Not found');
      ctx.state.errors = {
        notFound: body.email.trim()
      };
      return await next();
    }

    throw e
  }
}, async (ctx, next) => {
  ctx.body = await render('password-reset.html', ctx.state);
});

module.exports = router.routes();
