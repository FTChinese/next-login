import request from "superagent";
import {
    TypedJSON
} from "typedjson";
import {
    readerApi,
    KEY_USER_ID,
} from "../config/api";
import { 
    IProfile,
    INameFormData,
    IMobileFormData,
    IAddress,
} from "../models/reader";

class ProfileRepo {

    async fetchProfile(ftcId: string): Promise<IProfile> {
        const resp = await request
            .get(readerApi.profile)
            .set(KEY_USER_ID, ftcId);

        return resp.body;
    }

    async fetchAddress(ftcId: string): Promise<IAddress> {
        const resp = await request
            .get(readerApi.address)
            .set(KEY_USER_ID, ftcId)

        return resp.body;
    }

    async updateName(ftcId: string, data: INameFormData): Promise<boolean> {
        const resp = await request
            .patch(readerApi.name)
            .set(KEY_USER_ID, ftcId)
            .send(data);

        return resp.noContent;
    }

    async updateMobile(ftcId: string, data: IMobileFormData): Promise<boolean> {
        const resp = await request
            .patch(readerApi.mobile)
            .set(KEY_USER_ID, ftcId)
            .send(data);

        return resp.noContent;
    }

    async updateAddress(address: IAddress): Promise<boolean> {
        const resp = await request
            .patch(readerApi.address)
            .send(address);

        return resp.noContent;
    }
}

export const profileRepo = new ProfileRepo();
