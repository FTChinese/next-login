import request from "superagent";
import {
    TypedJSON,
} from "typedjson";
import {
    readerApi,
    KEY_USER_ID,
} from "../config/api";
import { 
    Profile,
    IName,
    IMobile,
    Address,
    IAddress,
    IProfileFormData,
} from "../models/reader";
import { oauth, noCache } from "../util/request";

const addressSerializer = new TypedJSON(Address);
const profileSeiralizer = new TypedJSON(Profile);

class ProfileRepo {

    async fetchProfile(ftcId: string): Promise<Profile> {
        const resp = await request
            .get(readerApi.profile)
            .use(oauth)
            .use(noCache)
            .set(KEY_USER_ID, ftcId);

        return profileSeiralizer.parse(resp.text)!;
    }

    async fetchAddress(ftcId: string): Promise<Address> {
        const resp = await request
            .get(readerApi.address)
            .use(oauth)
            .use(noCache)
            .set(KEY_USER_ID, ftcId)

        return addressSerializer.parse(resp.text)!;
    }

    async updateName(ftcId: string, data: IName): Promise<boolean> {
        const resp = await request
            .patch(readerApi.name)
            .use(oauth)
            .use(noCache)
            .set(KEY_USER_ID, ftcId)
            .send(data);

        return resp.noContent;
    }

    async updateMobile(ftcId: string, data: IMobile): Promise<boolean> {
        const resp = await request
            .patch(readerApi.mobile)
            .use(oauth)
            .use(noCache)
            .set(KEY_USER_ID, ftcId)
            .send(data);

        return resp.noContent;
    }

    async updateProfile(ftcId: string, data: IProfileFormData): Promise<boolean> {
        const resp = await request
            .patch(readerApi.profile)
            .use(oauth)
            .use(noCache)
            .set(KEY_USER_ID, ftcId)
            .send(data);

        return resp.noContent;
    }

    async updateAddress(ftcId: string, address: IAddress): Promise<boolean> {
        const resp = await request
            .patch(readerApi.address)
            .use(oauth)
            .use(noCache)
            .set(KEY_USER_ID, ftcId)
            .send(address);

        return resp.noContent;
    }
}

export const profileRepo = new ProfileRepo();
