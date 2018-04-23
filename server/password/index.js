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
// If email is invalid, it will to to enterEmail and redisplay the page.
router.post('/', sendLetter, enterEmail);

// User clicked the link in email. Check if the token is valid and return the email associated with the token. Then ask user to enter new password
router.get('/:code', verifyToken);

// Collect new password.
router.post('/:code', reset.do, reset.showErrors);

module.exports = router.routes();