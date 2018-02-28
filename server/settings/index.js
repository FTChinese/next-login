const debug = require('debug')('user:settings');
const Router = require('koa-router');
const profile = require('./profile');
const account = require('./account');
const notification = require('./notification');

const router = new Router();


router.use('/profile', profile);
router.use('/account', account);
router.use('/notification', notification);

module.exports = router.routes();