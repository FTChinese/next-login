import request from "superagent";
import { 
    TypedJSON 
} from "typedjson";
import {
    readerApi,
    KEY_USER_ID,
    KEY_UNION_ID,
    subsApi,
    KEY_APP_ID,
} from "../config/api";
import { 
    ICredentials, 
    Account,
    accountSerializer,
    IEmail,
    IPasswordReset,
    IAppHeader,
    IPasswords,
} from "../models/reader";
import { 
    WxSession
} from "../models/wx-oauth";
import { 
    viper 
} from "../config/viper";

const sessSerializer = new TypedJSON(WxSession);

class AccountRepo {

    async fetchFtcAccount(id: string): Promise<Account> {
        const resp = await request
            .get(readerApi.account)
            .set(KEY_USER_ID, id);

        return accountSerializer.parse(resp.text)!;
    }
    
    // As the first step of login process, or verify
    // password when linking accounts.
    async authenticate(c: ICredentials, app: IAppHeader): Promise<string> {
        const resp = await request
            .post(readerApi.login)
            .set(app)
            .send(c);

        const body = resp.body;

        if (body.id) {
            return body.id;
        }

        throw new Error("Incorrect api response");
    }

    async login(c: ICredentials, app: IAppHeader): Promise<Account> {
        const userId = await this.authenticate(c, app);

        return this.fetchFtcAccount(userId);
    }

    async emailExists(email: string): Promise<boolean> {
        try {
            const resp = await request
                .get(readerApi.exists)
                .query({
                    k: "email",
                    v: email,
                });

            return resp.noContent;
            
        } catch (e) {
            switch (e.status) {
                case 404:
                    return false;

                default:
                    throw e;
            }
        }
    }

    private async createReader(c: ICredentials, app: IAppHeader): Promise<string> {
        const resp = await request
            .post(readerApi.signup)
            .set(app)
            .send(c);

        const body = resp.body;

        if (body.id) {
            return body.id;
        }

        throw new Error("Incorrect api response");
    }

    async signUp(c: ICredentials, app: IAppHeader): Promise<Account> {
        const id = await this.createReader(c, app);

        return this.fetchFtcAccount(id);
    }

    async fetchWxSession(code: string, app: IAppHeader): Promise<WxSession> {
        const resp = await request
            .post(subsApi.wxLogin)
            .set(app)
            .set(KEY_APP_ID, viper.getConfig().wxapp.w_ftc.app_id)
            .send({ code });

        return sessSerializer.parse(resp.text)!;
    }

    // Fetch Wechat account by union id.
    async fetchWxAccount(unionId: string): Promise<Account> {
        const resp = await request
            .get(readerApi.wxAccount)
            .set(KEY_UNION_ID, unionId);

        return accountSerializer.parse(resp.text)!;
    }

    // Create an account for a wechat-logged-in user,
    // and returns the account's uuid.
    async wxSignUp(c: ICredentials, unionId: string, app: IAppHeader): Promise<string> {
        const resp = await request
            .post(readerApi.wxSignUp)
            .set(app)
            .set(KEY_UNION_ID, unionId)
            .send(c);

        const body = resp.body;

        if (body.id) {
            return body.id;
        }

        throw new Error("Incorrect API response");
    }

    async requestPwResetLetter(data: IEmail, app: IAppHeader): Promise<boolean> {
        const resp = await request
            .post(readerApi.passwordResetLetter)
            .set(app)
            .send(data);

        return resp.noContent;
    }

    async verifyPwResetToken(token: string): Promise<IEmail> {
        const resp = await request
            .get(readerApi.passwordResetToken(token))

        const body = resp.body;

        if (body.email) {
            return body;
        }

        throw new Error("incorrect api response");
    }

    async resetPassword(data: IPasswordReset): Promise<boolean> {
        const resp = await request
            .post(readerApi.resetPassword)
            .send(data);

        return resp.noContent;
    }

    async requestVerification(id: string, app: IAppHeader): Promise<boolean> {
        const resp = await request
            .get(readerApi.requestVerification)
            .set(app)
            .set(KEY_USER_ID, id);

        return resp.noContent;
    }

    async verifyEmail(token: string): Promise<boolean> {
        const resp = await request
            .put(readerApi.verifyEmail(token));

        return resp.noContent;
    }

    async updateEmail(ftcId: string, data: IEmail): Promise<boolean> {
        const resp = await request
            .patch(readerApi.email)
            .set(KEY_USER_ID, ftcId)
            .send(data);

        return resp.noContent;
    }

    async updatePassword(ftcId: string, data: IPasswords): Promise<boolean> {
        const resp = await request
            .patch(readerApi.password)
            .set(KEY_USER_ID, ftcId)
            .send(data);

        return resp.noContent;
    }
}

export const accountRepo = new AccountRepo();
