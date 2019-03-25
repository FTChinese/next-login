const Router = require('koa-router');
const debug = require('debug')('user:pay');
const render = require('../../util/render');

const {
  findPlan,
} = require("../../model/paywall");
const {
  clientApp,
} = require("../middleware");
const {
  Account,
} = require("../../model/request");
const router = new Router();

/**
 * @description Show payment selection page.
 * /user/subscription/pay/:tier/:cycle
 */
router.get("/:tier/:cycle", async (ctx, next) => {
  /**
   * @type {{tier: string, cycle: string}}
   */
  const params = ctx.params;
  const tier = params.tier;
  const cycle = params.cycle;

  const plan = findPlan(tier, cycle);

  if (!plan) {
    ctx.status = 404;
    return;
  }

  ctx.state.plan = plan;

  ctx.body = await render("subscription/pay.html", ctx.state);
});

/**
 * @description Accept payment method.
 * /user/subscription/pay/:tier/:cycle
 */
router.post("/:tier/:cycle", 

  clientApp(),

  async (ctx, next) => {
    /**
     * @type {{tier: string, cycle: string}}
     */
    const params = ctx.params;
    const tier = params.tier;
    const cycle = params.cycle;

    const payMethod = ctx.request.body.payMethod;

    if (!findPlan(tier, cycle)) {
      ctx.status = 404;
      return;
    }

    const account = new Account(ctx.session.user);

    if (!["alipay", "wechat"].includes(payMethod)) {
      ctx.status = 404;
      return;
    }
    switch (payMethod) {
      case "alipay":
        await account.aliPlayOrder(tier, cycle);

        break;
      case "wechat":
        await account.wxPlaceOrder(tier, cycle);
        
        break;
      default:
        ctx.state = 404;
        return;
    }
  }
);

module.exports = router.routes();
