const Router = require('koa-router');

const verifyEmail = require("./email");
const {
  denyWxOnlyAccess,
} = require("../middleware");

const router = new Router();

router.use("/email", denyWxOnlyAccess(), verifyEmail);

module.exports = router.routes();
