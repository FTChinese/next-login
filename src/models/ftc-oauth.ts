import { 
    URL, 
    URLSearchParams 
} from "url";
import {
    Dictionary,
} from "../models/data-types";
import {
    unixNow,
} from "../util/time";
import { entranceMap } from "../config/sitemap";

/**
 * @description Authorization Request.
 * If `redirect_uri` is misssing, invalid, or mismatching,
 * or if the `client_id` is missing or invalid,
 * show error message to user and MUST NOT redirect 
 * the user-agent to the invalid redirection URI.
 * For other failure reason redirect back to `redirect_uri`.
 */
export interface IAuthorizeRequest {
    responst_type: "code";
    client_id: string;
    redirect_uri: string;
    state: string;
}

// Authorization response.
export interface IAuthorizeResp extends Dictionary<string> {
    code: string;
    state: string;
}

/**
 * @description Error response
 * `invalid_request`: the request is missing a required parameter, include an invalid paramter value, include a parameter more than once, or is otherwise malformed.
 * `unauthorized_client`: The client is not authorized to request an authorization code using this method.
 * `access_denied`: The resource owner or authorization server denied the request.
 * `unsupported_response_type` The authorization server does not support obtaining an authorization code using this method.
 * `invalid_scope`: The requested scope is invalid, unknow, or malformed.
 */
export interface IErrorResp {
    error: "invalid_request" | "unauthorized_client" | "access_denied" | "unsupported_response_type" | "invalid_scope" | "server_error" | "temporarily_unavailable",
    error_description?: string;
    error_uri?: string;
    state?: string;
}

// The request data saved to session that can be used later.
export interface IOAuthSession extends IAuthorizeRequest {
    created: number;
}

export class OAuthServer {

    createSession(query: IAuthorizeRequest): IOAuthSession {
        return {
            ...query,
            created: unixNow(),
        }
    }

    // If user comes from oauth client while not logged in here, 
    // we should redirect user to the login page, 
    // and after user logged in, goes back to the 
    // authorization page again by rebuilding user's
    // request parameters.
    // client is redirect to -> 
    // /authorize?response_type=code&client_id=xxxx&redirect_uri=xxx&state=xxx, not logged in, redirect to ->
    // /login, login succesful and redirect back by appending previus query parameters which are saved in a session ->
    // /authorize?response_type=code&client_id=xxxx&redirect_uri=xxx&state=xxx -
    buildAuthorizeUrl(sess: IOAuthSession): string {

        const o: IAuthorizeRequest = {
            responst_type: sess.responst_type,
            client_id: sess.client_id,
            redirect_uri: sess.redirect_uri,
            state: sess.state,
        };

        const search = new URLSearchParams(o as any);

        return `${entranceMap.authorize}?${search.toString}`;
    }

    /**
     * @description Build OAuth2 callback url
     * @param code - fetched from api.
     */
    buildCallbackUrl(query: IAuthorizeRequest, code: string): string {
        const params: IAuthorizeResp = {
            code,
            state: query.state,
        };

        const cbUrl = new URL(query.redirect_uri);
        cbUrl.search = (new URLSearchParams(params)).toString();

        return cbUrl.href;
    }

    buildErrorUrl(query: IAuthorizeRequest, params: IErrorResp): string {
        const cbUrl = new URL(query.redirect_uri);
        
        const search = new URLSearchParams();

        search.set("error", params.error);

        if (params.error_description) {
            search.set("error_description", params.error_description);
        }

        if (params.state) {
            search.set("state", params.state);
        }

        cbUrl.search = search.toString();

        return cbUrl.href;
    }
}

export const oauthServer = new OAuthServer();
