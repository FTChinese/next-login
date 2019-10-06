import {
    jsonObject,
    jsonMember,
} from "typedjson";
import { iso8601ToCST } from "../util/formatter";
import { starredMap } from "../config/sitemap";

@jsonObject
export class Article {
    @jsonMember
    id: string;

    @jsonMember
    title: string;

    @jsonMember
    standfirst: string;

    @jsonMember
    createdAt: string;

    @jsonMember
    updatedAt: string;

    @jsonMember
    starredAt: string;

    get originalUrl(): string {
        return `http://www.ftchinese.com/story/${this.id}`;
    }

    get updatedCST(): string {
        try {
            return iso8601ToCST(this.updatedAt);
        } catch (e) {
            return this.updatedAt;
        }
    }

    get starredCST(): string {
        try {
            return iso8601ToCST(this.starredAt);
        } catch (e) {
            return this.starredAt;
        }
    }

    get deleteUrl(): string {
        return `${starredMap.base}/${this.id}/delete`;
    }
}
