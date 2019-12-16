import request from "superagent";
import { AndroidRelease, androidSerializer } from "../models/android";
import { readerApi } from "../config/api";
import { IPagination } from "../models/pagination";
import { oauth } from "../util/request";

class AppRelease {
    async latest(): Promise<AndroidRelease> {
        const resp = await request
            .get(readerApi.androidLatest)
            .use(oauth)

        return androidSerializer.parse(resp.text)!;
    }

    async list(paging: IPagination): Promise<Array<AndroidRelease>> {
        const resp = await request
            .get(readerApi.androidReleases)
            .use(oauth)
            .query(paging);

        return androidSerializer.parseAsArray(resp.text)!;
    }
}

export const androidRepo = new AppRelease();
