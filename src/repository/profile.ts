import request from "superagent";
import { readerApi, KEY_USER_ID } from "../config/api";
import { Profile, Address } from "../models/account";
import { oauth, noCache } from "../util/request";
import { NameForm, MobileForm, ProfileFormData } from "../models/form-data";

class ProfileService {
  async fetchProfile(ftcId: string): Promise<Profile> {
    const resp = await request
      .get(readerApi.profile)
      .use(oauth)
      .use(noCache)
      .set(KEY_USER_ID, ftcId);

    return resp.body;
  }

  async fetchAddress(ftcId: string): Promise<Address> {
    const resp = await request
      .get(readerApi.address)
      .use(oauth)
      .use(noCache)
      .set(KEY_USER_ID, ftcId);

    return resp.body;
  }

  async updateName(ftcId: string, data: NameForm): Promise<boolean> {
    const resp = await request
      .patch(readerApi.name)
      .use(oauth)
      .use(noCache)
      .set(KEY_USER_ID, ftcId)
      .send(data);

    return resp.noContent;
  }

  async updateMobile(ftcId: string, data: MobileForm): Promise<boolean> {
    const resp = await request
      .patch(readerApi.mobile)
      .use(oauth)
      .use(noCache)
      .set(KEY_USER_ID, ftcId)
      .send(data);

    return resp.noContent;
  }

  async updateProfile(ftcId: string, data: ProfileFormData): Promise<boolean> {
    const resp = await request
      .patch(readerApi.profile)
      .use(oauth)
      .use(noCache)
      .set(KEY_USER_ID, ftcId)
      .send(data);

    return resp.noContent;
  }

  async updateAddress(ftcId: string, address: Address): Promise<boolean> {
    const resp = await request
      .patch(readerApi.address)
      .use(oauth)
      .use(noCache)
      .set(KEY_USER_ID, ftcId)
      .send(address);

    return resp.noContent;
  }
}

export const profileService = new ProfileService();
