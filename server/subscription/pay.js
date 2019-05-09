const Router = require('koa-router');
const QRCode = require("qrcode");
const debug = require('debug')('user:pay');
const render = require('../../util/render');
const MobileDetect = require("mobile-detect");

const {
  paywall,
} = require("../../model/paywall");
const {
  clientApp,
} = require("../middleware");
const Account = require("../../lib/account");
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
  /**
   * @type {{sandbox: boolean}}
   */
  const query = ctx.request.query;

  const plan = paywall.findPlan(tier, cycle);

  if (!plan) {
    ctx.status = 404;
    return;
  }

  ctx.state.plan = plan;
  ctx.state.sandbox = query.sandbox ? true : false;

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

    /**
     * @type {{sandbox: boolean}}
     */
    const query = ctx.request.query;
    debug("Is sandbox: %O", query);

    const payMethod = ctx.request.body.payMethod;
    const plan = paywall.findPlan(tier, cycle);

    if (!plan) {
      ctx.status = 404;
      return;
    }

    // Detect device type.
    const md = new MobileDetect(ctx.header["user-agent"]);
    const isMobile = !!md.mobile();

    debug("Client app: %O", ctx.state.clientApp);

    /**
     * @type {Account}
     */
    const account = ctx.state.user;
    account.setClientApp(ctx.state.clientApp);

    try {
      switch (payMethod) {
        // Use user-agent to decide launch desktop web pay or mobile web pay
        case "alipay":
          // If user is using mobile browser on phone
          if (isMobile) {
            const aliOrder = await account.aliMobileOrder(tier, cycle);

            ctx.redirect(aliOrder.payUrl);
          } else {
            // Otherwise treat user on desktop

            const req = query.sandbox
              ? account.aliDesktopOrderTest(tier, cycle)
              : account.aliDesktopOrder(tier, cycle);

            const aliOrder = await req;

            ctx.session.subs = {
              orderId: aliOrder.ftcOrderId,
              tier,
              cycle,
              listPrice: aliOrder.listPrice,
              netPrice: aliOrder.netPrice,
              payMethod: "alipay",
            };

            ctx.redirect(aliOrder.payUrl);
          }
          break;

        case "wechat":
        // NOTE: we cannot use wechat's MWEB and JSAPI payment due to the fact those two
        // methods could only be used by ftacademy.com
        // accoding to wechat's rule.
          /**
           * @type {{codeUrl: string}}
           */
          const wxPrepay = await account.wxDesktopOrder(tier, cycle);
  
          const dataUrl = await QRCode.toDataURL(wxPrepay.codeUrl);
  
          ctx.state.plan = plan;
          ctx.state.qrData = dataUrl;
          ctx.body = await render("subscription/wxpay-qr.html", ctx.state);
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
