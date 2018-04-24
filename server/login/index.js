const debug = require('debug')('user:login');
const Router = require('koa-router');
const email = require('./email');
// const wechat = require('./wechat');

const router = new Router();

router.get('/', email.showPage);
router.post('/', email.handleLogin);

// Lauch Authorization Request
// router.get('/wechat', wechat.authRequest);
// Get Access Token Response
// router.post('/wechat/access', wechat.accessResponse);

module.exports = router.routes();