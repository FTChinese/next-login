const {
  OrderUrlBuilder,
} = require("../lib/endpoints");
const {
  TIER_STANDARD,
  CYCLE_YEAR,
} = require("../lib/enum");

test("ali-desktop", () => {
  const url = new OrderUrlBuilder()
    .setTier(TIER_STANDARD)
    .setCycle(CYCLE_YEAR)
    .setSandbox(false)
    .buildAliDesktop();

  console.log(url);
});

test("ali-mobile", () => {
  const url = new OrderUrlBuilder()
    .setTier(TIER_STANDARD)
    .setCycle(CYCLE_YEAR)
    .setSandbox(false)
    .buildAliMobile();

  console.log(url);
});

test("wx-desktop", () => {
  const url = new OrderUrlBuilder()
    .setTier(TIER_STANDARD)
    .setCycle(CYCLE_YEAR)
    .setSandbox(false)
    .buildWxDesktop();

  console.log(url);
});

