import { Request } from "superagent";
import { viper } from "../config/viper";

export function oauth(req: Request) {
    req.auth(viper.getAccessToken(), {type: "bearer"});
}

export function noCache(req: Request) {
    req.set("Cache-Control", "no-cache, no-store");
}

