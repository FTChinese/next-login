import {
    jsonObject,
    jsonMember,
    TypedJSON,
} from "typedjson";
import { iso8601ToCST } from "../util/formatter";

@jsonObject
export class AndroidRelease {
    @jsonMember
    versionName: string;

    @jsonMember
    versionCode: number;

    @jsonMember
    body?: string;

    @jsonMember
    apkUrl: string;

    @jsonMember
    createdAt: string;

    @jsonMember
    updatedAt: string;

    releaseTimeCST(): string {
        return iso8601ToCST(this.createdAt);
    }
}

export const androidSerializer = new TypedJSON(AndroidRelease);
