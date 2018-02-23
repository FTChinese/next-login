const debug = require('debug')('login:server');
const Router = require('koa-router');
const render = require('../utils/render');
const {ErrorForbidden} = require('../utils/http-errors');
const got = require('got');
const getAccess = require('../utils/get-access');
const router = new Router();

async function showPage (ctx) {
  debug("Access data: %o", ctx.accessData);
  ctx.body = await render('login.html', ctx.state);
};

router.get('/', showPage);

router.post('/', async (ctx, next) => {
  /**
   * @type {Object} credentials
   * @property {string} email
   * @property {string} password
   */
  const credentials = ctx.request.body.credentials;

  debug('Access token: %s', ctx.accessData.access_token);
  const resp = await got.post('http://localhost:8000', {
    headers: {
      'Authorization': `Bearer ${ctx.accessData.access_token}`
    },
    json: true,
    body: credentials
  });

  if (resp.statusCode == 401) {
    const accessData = await getAccess();
    ctx.app.context.accessData = accessData;
    const resp = await got.post('http://localhost:8000', {
      headers: {
        'Authorization': `Bearer ${accessData.access_token}`
      },
      json: true,
      body: credentials
    });
  }
  ctx.body = resp.body;
});




module.exports = router.routes();
