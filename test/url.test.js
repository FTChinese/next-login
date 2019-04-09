const {
  URL,
  URLSearchParams,
} = require("url");
const {
  sitemap
} = require("../lib/sitemap");

test("build", () => {
  const query = {
    response_type: "code",
    client_id: "1234567890",
    redirect_uri: "http://localhost:4200/callback",
    state: "jljaejfuiu",
  }

  const params = new URLSearchParams(query);

  console.log(new URLSearchParams({}).toString());
  console.log(params.toString());

  console.log(`${sitemap.login}?${params.toString()}`);

  console.log(new URL("http://www.ftacademy.cn/subscription.html"));

});
