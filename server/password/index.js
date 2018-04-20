const Router = require('koa-router');
const render = require('../../utils/render');

const enterEmail = require('./enter-email');
const sendLetter = require('./send-letter');
const verifyToken = require('./verify-token');
const reset = require('./reset');

const router = new Router();

// Ask user to enter email
router.get('/', enterEmail);
// Collect user entered email, check if email is valid, and send letter.
router.post('/', sendLetter, async (ctx, next) => {
  ctx.body = await render('password/enter-email.html', ctx.state);
});

// User clicked the link in email. Check if the token is valid and return the email associated with the token. Then ask user to enter new password
router.get('/:code', verifyToken);

// Collect new password.
router.post('/:code', reset, async (ctx, next) => {
  // This is used to display error message only.
  ctx.body = await render('password/new-password.html', ctx.state);
});

module.exports = router.routes();