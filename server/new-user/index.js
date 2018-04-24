const Router = require('koa-router');
const signup = require('./signup');
const verify = require('./verify');
const plan = require('./plan');
const checkLogin = require('../../middlewares/check-login');

const router = new Router();

router.get('/', signup.showPage);
router.post('/', signup.handleCredentials);
router.get('/plan', plan.showPage);
router.post('/plan', plan.handlePlan);
router.get('/verify/:token', checkLogin(), verify.checkToken);

// Later we might need to add ajax support to check if username or email is already being taken
//
// router.use('/check-username', checkUsername);
// router.use('/check-email', checkEmail);

module.exports = router.routes();