import { resolve } from "path";
import { readFileSync } from "fs";
import toml from "toml";

interface OAuthClient {
    client_id: string;
    client_secret: string;
}

interface Env {
    koa_session: {
        next_user: string;
    };
}

class Viper {
    private filePath: string;
    private fileName: string;
    private config: any;

    setConfigPath(p?: string): Viper {
        if (!p) {
            throw new Error("path to cofiguration file must be a string");
        }
        this.filePath = p;
        return this;
    }

    setConfigName(name: string): Viper {
        this.fileName = name;
        return this;
    }

    readInConfig(): Viper {
        const configFile = resolve(this.filePath, this.fileName);
        this.config = toml.parse(readFileSync(configFile, "utf-8"));
        return this;
    }

    getConfig(): Env {
        return this.config;
    }
}

export const viper = new Viper();
export const isProduction = process.env.NODE_ENV == "production";

