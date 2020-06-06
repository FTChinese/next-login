import { Article } from "../models/bookmarks";
import { Paging } from "../models/pagination";
import { Account } from "../models/reader";
import { articleRepo } from "../repository/article";
import { IFetchResult, APIError } from "../repository/api-response";
import { Flash } from "../widget/flash";

interface StarredPage {
  flash?: Flash;
  articles: Array<Article>;
  paging?: Paging;
}

export class StarredPageBuilder {
  
  constructor(readonly account: Account) {}

  /**
   * 
   * @param paging 
   * @param errMsg The error message from direction after delete, if present.
   */
  async buildUI(paging: Paging, errMsg?: string): Promise<StarredPage> {
    try {
      const articles = await articleRepo.list(this.account, paging.toObject());

      return {
        flash: errMsg ? Flash.danger(errMsg) : undefined,
        articles,
        paging: paging.setSize(articles.length),
      };
    } catch (e) {
      const errResp = new APIError(e);

      return {
        flash: Flash.danger(errResp.message),
        articles: [],
      }
    }
  }

  async delete(id: string): Promise<APIError | null> {
    try {
      await articleRepo.unstar(this.account, id);

      return null;
    } catch (e) {
      return new APIError(e);
    }
  }
}
