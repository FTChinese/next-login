import {
    subsApi,
} from "../src/config/api";
import { viper } from "../src/config/viper";

viper.setConfigPath(process.env.HOME)
    .setConfigName("config/api.toml")
    .readInConfig();

test("api-endpoint", () => {
    console.log(subsApi.wxRedirect(true));
});
