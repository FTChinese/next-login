const QRCode = require("qrcode");

test("qrcode data url", async () => {
  const result = await QRCode.toDataURL("weixin://wxpay/bizpayurl?pr=iw46Es7");

  console.log(result);
});
