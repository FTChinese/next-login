import request from "superagent";
import { IAuthorizeRequest } from "../models/ftc-oauth";
import { Account, LoginMethod } from "../models/reader";
import { readerApi } from "../config/api";

interface IReqBody {
    clientId: string;
    redirectUri: string;
    state: string;
    userId: string;
    loginMethod: LoginMethod;
}

interface ICodeResp {
    code: string;
}

class OAuthRepo {
    
    async requestCode(params: IAuthorizeRequest, account: Account): Promise<string> {
        const data: IReqBody = {
            clientId: params.client_id,
            redirectUri: params.redirect_uri,
            state: params.state,
            userId: account.loginMethod == "email" ? account.id : account.unionId!,
            loginMethod: account.loginMethod,
        };

        const resp = await request
            .post(readerApi.oauthCode)
            .send(data);

        const body: ICodeResp = resp.body;

        return body.code;
    }
}

export const oauthRepo = new OAuthRepo();
