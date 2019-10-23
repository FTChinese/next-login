import { viper } from "../src/config/viper";
viper.setConfigPath(process.env.HOME)
    .setConfigName("config/api.toml")
    .readInConfig();

test("config", () => {
    console.log(viper.getConfig().api_url);
});
