import { UIBase } from "./ui";
import { Article } from "../models/bookmarks";
import { Paging } from "../models/pagination";
import { Account } from "../models/reader";
import { articleRepo } from "../repository/article";
import { IFetchResult, APIError } from "./api-response";

interface UIStarred extends UIBase {
    articles: Array<Article>;
    paging: Paging;
}

class ArticleViewModel {
    async buildUI(account: Account, paging: Paging, errMsg?: string): Promise<UIStarred> {
        const articles =  await articleRepo.list(account, paging.toObject());

        return {
            errors: errMsg ? {
                message: errMsg,
            } : undefined,
            articles,
            paging: paging.setSize(articles.length),
        };
    }

    async delete(account: Account, id: string): Promise<IFetchResult<boolean>> {
        try {
            const ok = await articleRepo.unstar(account, id);

            return {
                success: ok,
            };
        } catch (e) {
            return {
                errResp: new APIError(e)
            };
        }
    }
}

export const articleViewModel = new ArticleViewModel();
