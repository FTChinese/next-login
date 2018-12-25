const Router = require('koa-router');

const verifyEmail = require("./email");

const router = new Router();

router.use("/email", verifyEmail);

module.exports = router.routes();