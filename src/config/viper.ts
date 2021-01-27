import { resolve } from "path";
import { readFileSync } from "fs";
import toml from "toml";

export interface IOAuthClient {
    client_id: string;
    client_secret: string;
}

interface APIKeys {
  dev: string;
  prod: string;
}

interface WebAppConfig {
  koa_session: string;
  jwt_signing_key: string;
  csrf_key: string;
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
    web_app: {
      next_reader: WebAppConfig;
    }
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
        subs_v2: string;
        sub_sandbox: string;
    };
    api_keys: {
      next_reader: APIKeys;
    }
}

interface SubsAPIBaseURLs {
  dev: string;
  prod: string;
  v2: string;
  sandbox: string; // Sandbox on production server. This is only used by test account for stripe pay, or iap for refreshing.
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

    get subsAPIBaseUrl(): SubsAPIBaseURLs {
      return {
        dev: "http://localhost:8200",
        prod: this.getConfig().api_url.subscription_v1,
        v2: this.getConfig().api_url.subs_v2,
        sandbox: this.getConfig().api_url.sub_sandbox
      };
    }

    getAccessToken(): string {
        if (this.accessToken) {
            return this.accessToken;
        }

        const tokens = this.getConfig()
            .api_keys
            .next_reader;

        if (this.isProduction) {
            this.accessToken = tokens.prod;
        } else {
            this.accessToken = tokens.dev
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


