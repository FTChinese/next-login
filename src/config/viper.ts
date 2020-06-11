import { resolve } from "path";
import { readFileSync } from "fs";
import toml from "toml";

export interface IOAuthClient {
    client_id: string;
    client_secret: string;
}

export interface IAccessToken {
    development: string;
    production: string;
}

export interface IWxApp {
    app_id: string;
    secret: string;
}

export interface IWxPayApp extends IWxApp {
    mch_id: string;
    api_key: string;
}

interface OAuthHeader {
    Authorization: string
}

interface Config {
    koa_session: {
        next_user: string;
    };
    wxapp: {
        web_pay: IWxPayApp;
        web_oauth: IWxApp;
    };
    oauth_client: {
        fta_dev: IOAuthClient;
        fta_sandbox: IOAuthClient;
        fta_prod: IOAuthClient;
    };
    api_url: {
        reader_v1: string;
        subscription_v1: string;
        sub_sandbox: string;
    };
    access_token: {
        next_reader: IAccessToken;
    };
}

class Viper {
    private filePath: string;
    private fileName: string;
    private config: any;
    private accessToken: string
    readonly port = 8200;

    constructor(readonly isProduction: boolean) {
    }

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

    getConfig(): Config {
        return this.config;
    }

    get readerAPIBaseUrl(): string {
      return this.isProduction
        ? this.getConfig().api_url.reader_v1
        : "http://localhost:8000"
    }

    get subsAPIBaseUrl(): string {
      return this.isProduction
        ? this.getConfig().api_url.subscription_v1
        : "http://localhost:8200";
    }

    get subsAPISandboxBaseUrl(): string {
      return this.getConfig().api_url.sub_sandbox
    }

    getAccessToken(): string {
        if (this.accessToken) {
            return this.accessToken;
        }

        const tokens = this.getConfig()
            .access_token
            .next_reader;

        if (this.isProduction) {
            this.accessToken = tokens.production;
        } else {
            this.accessToken = tokens.development
        }

        return this.accessToken;
    }

    getOAuthHeader(): OAuthHeader {
        return {
            "Authorization": `Bearer ${this.getAccessToken}`
        };
    }
}

export const viper = new Viper(process.env.NODE_ENV == "production")
    .setConfigPath(process.env.HOME)
    .setConfigName("config/api.toml")
    .readInConfig();


