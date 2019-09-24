import request from "superagent";
import {
    TypedJSON
} from "typedjson";
import {
    readerApi,
    KEY_USER_ID,
} from "../config/api";
import { 
    ICredentials, 
    IClientApp, 
    Account,
    IEmailFormData,
    IPasswordReset,
    INameFormData,
    IMobileFormData,
    IPasswordsFormData,
    IAppHeader,
} from "../models/reader";

const accountSerializer = new TypedJSON(Account);

class AccountRepo {

    private async fetchFtcAccount(id: string): Promise<Account> {
        const resp = await request
            .get(readerApi.account)
            .set(KEY_USER_ID, id);

        return accountSerializer.parse(resp.text)!;
    }

    private async authenticate(c: ICredentials, app: IAppHeader): Promise<string> {
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

    async signUp(c: ICredentials, app: IAppHeader): Promise<Account> {
        const id = await this.createReader(c, app);

        return this.fetchFtcAccount(id);
    }

    async requestPwResetLetter(data: IEmailFormData, app: IClientApp): Promise<boolean> {
        const resp = await request
            .post(readerApi.passwordResetLetter)
            .set(app)
            .send(data);

        return resp.noContent;
    }

    async verifyPwResetTOken(token: string): Promise<IEmailFormData> {
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

    async requestVerification(id: string, app: IClientApp): Promise<boolean> {
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

    async updateEmail(ftcId: string, data: IEmailFormData): Promise<boolean> {
        const resp = await request
            .patch(readerApi.email)
            .set(KEY_USER_ID, ftcId)
            .send(data);

        return resp.noContent;
    }

    

    async updatePassword(ftcId: string, data: IPasswordsFormData): Promise<boolean> {
        const resp = await request
            .post(readerApi.password)
            .set(KEY_USER_ID, ftcId)
            .send(data);

        return resp.noContent;
    }
}

export const accountRepo = new AccountRepo();
