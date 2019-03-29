const Router = require('koa-router');
const QRCode = require("qrcode");
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
    const plan = findPlan(tier, cycle);

    if (!plan) {
      ctx.status = 404;
      return;
    }

    const account = new Account(ctx.session.user);

    try {
      switch (payMethod) {
        // Use user-agent to decide launch desktop web pay or mobile web pay
        case "alipay":
          const aliOrder = await account.aliPlaceOrder(tier, cycle);
          ctx.redirect(aliOrder.payUrl);
          
          break;
        case "wechat":
          /**
           * @type {{codeUrl: string}}
           */
          const wxPrepay = await account.wxPlaceOrder(tier, cycle);
  
          const dataUrl = await QRCode.toDataURL(wxPrepay.codeUrl);
  
          ctx.state.plan = plan;
          ctx.state.qrData = dataUrl;
          ctx.body = await render("subscription/wxpay-qr.html", ctx.state);
          // QRCode.toFile
          
          break;
        default:
          ctx.state = 404;
          return;
      }
    } catch (e) {
      throw e;
    }
  }
);

module.exports = router.routes();
