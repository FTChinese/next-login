import { 
    URL, 
    URLSearchParams 
} from "url";
import Chance from "chance";
import { pool } from "../util/random";
import {
    Dictionary,
} from "../models/data-types";

const chance = new Chance();

// Request data send from client.
export interface IAuthorizeRequest {
    responst_type: "code";
    client_id: string;
    redirect_uri: string;
    state: string;
}

// The request data saved to session that can be used later.
export interface IOAuthSession extends IAuthorizeRequest {
    created: number;
}

export interface ICallbackParams extends Dictionary<string> {
    code: string;
    state: string;
}

export interface IErrorParams {
    error: string,
    error_description?: string;
    state?: string;
}

export class OAuthServer {

    private readonly redirectUri: string;
    private readonly state: string;

    constructor(req: IAuthorizeRequest) {
        this.redirectUri = req.redirect_uri;
        this.state = req.state;
    }

    /**
     * @description Build OAuth2 callback url
     * @param code - fetched from api.
     */
    buildCallbackUrl(code: string): string {
        const params: ICallbackParams = {
            code,
            state: this.state,
        };

        const cbUrl = new URL(this.redirectUri);
        cbUrl.search = (new URLSearchParams(params)).toString();

        return cbUrl.href;
    }

    buildErrorUrl(params: IErrorParams): string {
        const cbUrl = new URL(this.redirectUri);

        const search = new URLSearchParams(Object.entries(params));
        cbUrl.search = search.toString();

        return cbUrl.href;
    }
}
