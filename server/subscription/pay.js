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
const {
  OrderUrlBuilder,
} = require("../../lib/endpoints");
const {
  PAY_ALI,
  PAY_WX,
} = require("../../lib/enum");

const router = new Router();

/**
 * @description Show payment selection page.
 * /user/subscription/pay/:tier/:cycle?sandbox=true
 * To use sandbox in production, apend query paramter `sandbox=true`; you do not need to use this in development since you can run subscription api in sandbox mode locally.
 */
router.get("/:tier/:cycle", async (ctx, next) => {
  /**
   * @type {{tier: string, cycle: string}}
   */
  const params = ctx.params;
  const tier = params.tier;
  const cycle = params.cycle;
  /**
   * @type {{sandbox?: "true"}}
   */
  const query = ctx.request.query;

  const plan = paywall.findPlan(tier, cycle);

  if (!plan) {
    ctx.status = 404;
    return;
  }

  ctx.state.plan = plan;
  ctx.state.sandbox = query.sandbox;

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

    const builder = new OrderUrlBuilder()
      .setTier(tier)
      .setCycle(cycle)
      .setSandbox(!!query.sandbox);

    try {
      switch (payMethod) {
        // Use user-agent to decide launch desktop web pay or mobile web pay
        case PAY_ALI:
          // If user is using mobile browser on phone
          if (isMobile) {
            const aliOrder = await account.aliMobileOrder(builder.buildAliMobile());

            // Data used to display pay result.
            ctx.session.subs = {
              orderId: aliOrder.ftcOrderId,
              tier,
              cycle,
              listPrice: aliOrder.listPrice,
              netPrice: aliOrder.netPrice,
              payMethod: payMethod,
            };

            ctx.redirect(aliOrder.payUrl);
          } else {
            // Otherwise treat user on desktop
            const aliOrder = await account.aliDesktopOrder(builder.buildAliDesktop());

            ctx.session.subs = {
              orderId: aliOrder.ftcOrderId,
              tier,
              cycle,
              listPrice: aliOrder.listPrice,
              netPrice: aliOrder.netPrice,
              payMethod: payMethod,
            };

            ctx.redirect(aliOrder.payUrl);
          }
          break;

        case PAY_WX:
        // NOTE: we cannot use wechat's MWEB and JSAPI payment due to the fact those two
        // methods could only be used by ftacademy.com
        // accoding to wechat's rule.
          const order = await account.wxDesktopOrder(builder.buildWxDesktop());
  
          /**
           * @type {ISubsOrder}
           */
          ctx.session.subs = {
            tier,
            cycle,
            listPrice: order.listPrice,
            netPrice: order.netPrice,
            orderId: order.ftcOrderId,
            appId: order.appId,
            payMethod: payMethod,
          };

          const dataUrl = await QRCode.toDataURL(order.codeUrl);
          
          // On the top of the page show the product user is purchasing
          ctx.state.plan = plan;
          // At the bottom of the page show the qr code.
          ctx.state.qrData = dataUrl;

          ctx.body = await render("subscription/wxpay-qr.html", ctx.state);
          break;

        default:
          ctx.status = 404;
          return;
      }
    } catch (e) {
      throw e;
    }
  }
);

module.exports = router.routes();
