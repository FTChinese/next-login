import request from "superagent";
import { AndroidRelease } from "../models/android";
import { readerApi } from "./api";
import { IPagination } from "../models/pagination";
import { oauth } from "../util/request";

class AppRelease {
    async latest(): Promise<AndroidRelease> {
        const resp = await request
            .get(readerApi.androidLatest)
            .use(oauth)

        return resp.body;
    }

    async list(paging: IPagination): Promise<Array<AndroidRelease>> {
        const resp = await request
            .get(readerApi.androidReleases)
            .use(oauth)
            .query(paging);

        return resp.body;
    }
}

export const androidRepo = new AppRelease();
