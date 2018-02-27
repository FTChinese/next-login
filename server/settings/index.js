const debug = require('debug')('login:settings');
const Router = require('koa-router');
const profile = require('./profile');
const account = require('./account');

const router = new Router();

router.use('/profile', profile);
router.use('/account', account);
// router.use('/notification', );

module.exports = router.routes();