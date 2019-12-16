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
    private isProduction: boolean
    private accessToken: string

    constructor(isProd: boolean) {
        this.isProduction = isProd
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

export const isProduction = process.env.NODE_ENV == "production";
export const viper = new Viper(isProduction);


