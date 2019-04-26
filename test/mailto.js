const {
  URL,
  URLSearchParams,
} = require("url");

const baseUrl = new URL("mailto:subscriber.service@ftchinese.com");

const params = new URLSearchParams();
params.set("from", "foo@example.org");
params.set("subject", "标准版/年 2019-04-26");

baseUrl.search = params.toString();

console.log(baseUrl.href);
