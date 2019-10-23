import { viper } from "../src/config/viper";
viper.setConfigPath(process.env.HOME)
    .setConfigName("config/api.toml")
    .readInConfig();

import {
    subsApi,
} from "../src/config/api";

test("api-endpoint", () => {

    console.log(subsApi.wxRedirect(true));
    console.log(`Ali pay desktop in sandbox: ${subsApi.aliPayDesktop("standard", "year", true)}`);
    console.log(`Ali pay desktop: ${subsApi.aliPayDesktop("standard", "year", false)}`);

    console.log(`Wxpay desktop: ${subsApi.wxPayDesktop("standard", "year", true)}`);
});
