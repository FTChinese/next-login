export interface Article {
    id: string;
    title: string;
    standfirst: string;
    createdAt: string;
    updatedAt: string;
    starredAt: string;

    // get originalUrl(): string {
    //     return `http://www.ftchinese.com/story/${this.id}`;
    // }

    // get updatedCST(): string {
    //     try {
    //         return iso8601ToCST(this.updatedAt);
    //     } catch (e) {
    //         return this.updatedAt;
    //     }
    // }

    // get starredCST(): string {
    //     try {
    //         return iso8601ToCST(this.starredAt);
    //     } catch (e) {
    //         return this.starredAt;
    //     }
    // }

    // get deleteUrl(): string {
    //     return `${starredMap.base}/${this.id}/delete`;
    // }
}
