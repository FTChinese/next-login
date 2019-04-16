const {
  viper,
} = require("../lib/config");

viper.setConfigPath(process.env.HOME)
  .setConfigName("config/api.toml")
  .readInConfig();

const {
  DateTime,
} = require("luxon");

const {
  wxOAuth,
  WxSession
} = require("../lib/wxlogin");

const mockWxSession = new WxSession({
  id: "3ab0551980",
  unionId: "tvSxA7L6cgl8nwkrScm_yRzZoVTy",
  createdAt: DateTime.utc().toISO({suppressMilliseconds: true}),
});

test("oauth", async () => {
  const state = await wxOAuth.generateState();

  console.log(state);

  console.log(wxOAuth.isStateExpired(state));
});

test("state", async () => {
  const state = await wxOAuth.generateState();

  state.t = state.t - 6 * 60;

  console.log(wxOAuth.isStateExpired(state));
});
