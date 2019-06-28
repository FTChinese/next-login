const {
  viper,
} = require("./lib/config");
const config = viper.setConfigPath(process.env.HOME)
  .setConfigName("config/api.toml")
  .readInConfig()
  .getConfig();
const debug = require("debug")('user:index');
const path = require('path');
const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');

const boot = require('./util/boot-app');

const {
  env,
  nav,
  checkSession,
  handleErrors,
  noCache,
} = require("./server/middleware");

const signup = require('./server/signup');
const login = require('./server/login');
const oauth2 = require("./server/oauth2");
const logout = require('./server/logout');
const verify = require('./server/verification');
const forgotPassword = require('./server/forgot-password');

const profile = require('./server/profile');
const account = require('./server/account');

const subscription = require('./server/subscription');
const notification = require("./server/notification");
const starred = require("./server/starred");
const feedback = require("./server/feedback");

const version = require('./server/version');
const testRouter = require("./server/test");

const isProduction = process.env.NODE_ENV === 'production';
const app = new Koa();
const router = new Router();

app.proxy = true;

app.keys = [config.koa_session.next_user];

app.use(logger());

if (!isProduction) {
  const static = require('koa-static');
  app.use(static(path.resolve(process.cwd(), 'node_modules')));
  app.use(static(path.resolve(process.cwd(), 'build/dev')));
}

// Configurations passed around
app.use(env());
app.use(nav());
app.use(noCache());
app.use(session({
  renew: true,
  key: "_ftc:next"
}, app));
app.use(handleErrors());
app.use(bodyParser());

/**
 * @todo Add a middleware to handle Cross Site Request Forgery based on https://github.com/pillarjs/csrf.
 * 
 * Refer to https://github.com/expressjs/csurf.
 * There is a koa middleware https://github.com/koajs/csrf but neither well written nor well mataintained.
 */
router.get("/", async(ctx) => {
  ctx.redirect("/login");
});

router.use('/login', checkSession({redirect: false}), login);
router.use('/logout', logout);
router.use('/signup', checkSession({redirect: false}), signup);
router.use('/verify', checkSession({redirect: false}), verify);
router.use('/password-reset', checkSession({redirect: false}), forgotPassword);
router.use("/oauth2", oauth2);
router.use('/profile', checkSession(), profile);
router.use('/account', checkSession(), account);
router.use('/subscription', checkSession(), subscription);
router.use('/notification', checkSession(), notification);
router.use("/starred", checkSession(), starred);
// router.use("/feedback", checkSession(), feedback);

router.use('/__version', version);
router.use("/test", testRouter);

app.use(router.routes());

debug(router.stack.map(layer => layer.path));

boot(app)
  .catch(err => {
    debug.error('Bootup error: %O', err);
  });
