import Router from "koa-router";
import { APIError } from "../models/api-response";
import { CheckoutJWTPayload, newCheckoutReq } from "../models/stripe";
import { viper } from "../config/viper";
import { subsService } from "../repository/subscription";
import { verifyStripeJWT } from "./middleware";
import { Middleware } from "koa";

function handleError(): Middleware {
  return async function (ctx, next) {
    try {
      await next();
    } catch (e) {
      const errHandler = new APIError(e);
      ctx.status = errHandler.status || 500;
      ctx.body = errHandler.apiResp;
    }
  }
}

const router = new Router();

router.use(handleError());
router.use(verifyStripeJWT());

router.get('/stripe/publishable-key', async(ctx) => {
  ctx.body = {
    key: viper.getStripePublishableKey(),
  }
});

router.post('/stripe/checkout-session', async(ctx) => {
  const payload: CheckoutJWTPayload = ctx.state.stripeJWT;

  console.log(newCheckoutReq(ctx.origin, payload));
  
  const sess = await subsService.stripeCheckoutSession(
    payload,
    ctx.origin
  );

  console.log(sess);

  ctx.body = sess;
});

export default router.routes();
