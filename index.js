const debug = require('./util/debug')('user:index');
// const log = require('./util/logger');
const path = require('path');
const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');

const boot = require('./util/boot-app');

const env = require('./middleware/env');
const nav = require('./middleware/nav');
const checkSession = require('./middleware/check-session');
const handleErrors = require('./middleware/handle-errors');
const setHeader = require('./middleware/set-header');

const signup = require('./server/signup');
const plan = require('./server/plan');
const login = require('./server/login');
const logout = require('./server/logout');
const verifyEmail = require('./server/verify-email');
const passwordReset = require('./server/password-reset');
const profile = require('./server/profile');
const email = require('./server/email');
const account = require('./server/account');
const membership = require('./server/membership');
const address = require('./server/address');

const isProduction = process.env.NODE_ENV === 'production';
const app = new Koa();
const router = new Router({
  prefix: '/user'
});

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
app.use(nav());
app.use(setHeader());
app.use(session(app));
app.use(handleErrors());
app.use(bodyParser());


/**
 * @todo Add a middleware to handle Cross Site Request Forgery based on https://github.com/pillarjs/csrf.
 * 
 * Refer to https://github.com/expressjs/csurf.
 * There is a koa middleware https://github.com/koajs/csrf but neither well written nor well mataintained.
 */

router.use('/login', checkSession({redirect: false}), login);
router.use('/logout', logout);
router.use('/signup', signup);
router.use('/plan', plan);
router.use('/verify-email', checkSession({redirect: false}), verifyEmail);
router.use('/password-reset', checkSession({redirect: false}), passwordReset);
router.use('/profile', checkSession(), profile);
router.use('/email', checkSession(), email);
router.use('/account', checkSession(), account);
router.use('/membership', checkSession(), membership);
router.use('/address', checkSession(), address);

app.use(router.routes());

debug.info(router.stack.map(layer => layer.path));

boot(app)
  .catch(err => {
    debug.error('Bootup error: %O', err);
  });

