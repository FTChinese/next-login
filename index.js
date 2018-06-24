const debug = require('./utils/debug')('user:index');
// const log = require('./utils/logger');
const path = require('path');
const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');

const env = require('./middlewares/env');
const nav = require('./middlewares/nav');
const checkLogin = require('./middlewares/check-login');
const handleErrors = require('./middlewares/handle-errors');
const inlineMin = require('./middlewares/inline-min');

const signup = require('./server/signup');
const plan = require('./server/plan');
const login = require('./server/login');
const logout = require('./server/logout');
const passwordReset = require('./server/password-reset');
const profile = require('./server/profile');
const email = require('./server/email');
const account = require('./server/account');
const membership = require('./server/membership');
const address = require('./server/address');

const isProduction = process.env.NODE_ENV === 'production';
const app = new Koa();
const router = new Router();

app.proxy = true;
/**
 * @todo Use dotenv.
 */
app.keys = ['SEKRIT1', 'SEKRIT2'];

app.use(logger());

if (!isProduction) {
  const static = require('koa-static');
  app.use(static(path.resolve(process.cwd(), 'node_modules')));
  app.use(static(path.resolve(process.cwd(), 'client')));
}

// Configurations passed around
app.use(env());
// app.use(async function (ctx, next) {
//   debug.info('Middleware: check access token');
//   if (ctx.accessData) {
//     debug.info('Access data %O', ctx.accessData);
//     const createdAt = ctx.accessData.created_at;
//     const expiresIn = ctx.accessData.expires_in;
//     const expiresAt = moment.utc(createdAt).add(expiresIn, 'seconds');

//     // If the access token is already expired
//     if (expiresAt.isBefore(moment.utc(), 'seconds')) {
//       debug.info('Access data expired');
//       delete app.context.accessData;
//     }
//   }
//   await next();
// });

// app.use(async function(ctx, next) {
//   if (!ctx.accessData) {
//     debug.info('Access data is not found.');
//     app.context.accessData = await fetchAccess();
//   }

//   await next();
// });

app.use(inlineMin());
app.use(session(app));
app.use(handleErrors());
app.use(bodyParser());

/**
 * @todo Add a middleware to handle Cross Site Request Forgery based on https://github.com/pillarjs/csrf.
 * 
 * Refer to https://github.com/expressjs/csurf.
 * There is a koa middleware https://github.com/koajs/csrf but neither well written nor well mataintained.
 */

router.use('/login', login);
router.use('/logout', logout);
router.use('/signup', signup);
router.use('/plan', plan);
router.use('/password-reset', passwordReset);
router.use('/profile', checkLogin(), nav(), profile);
router.use('/email', checkLogin(), nav(), email);
router.use('/account', checkLogin(), nav(), account);
router.use('/membership', checkLogin(), nav(), membership);
router.use('/address', checkLogin(), nav(), address);

app.use(router.routes());

console.log(router.stack.map(layer => layer.path));

/**
 * @param {Koa} app - a Koa instance
 */
async function bootUp(app) {
  const appName = 'next-user';
  debug.info('booting %s', appName);

  const port = process.env.PORT || 3000;

  // try {
  //   /**
  //    * @type {{access_token: string, created_at: string, expires_in: number, token_type: string}}
  //    */
  //   app.context.accessData = await fetchAccess();
  // } catch (e) {
  //   debug.error("Get access token error: %O", e)
  // }

  // Create HTTP server
  const server = app.listen(port);

  // Logging server error.
  server.on('error', (error) => {
    debug.error('Server error: %O', error);
  });

  // Listening event handler
  server.on('listening', () => {
    debug.info('%s running on %O', appName, server.address());
  });
}

bootUp(app)
  .catch(err => {
    debug.error('Bootup error: %O', err);
  });
