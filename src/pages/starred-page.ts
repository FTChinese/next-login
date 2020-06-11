import { Article } from "../models/bookmarks";
import { Paging } from "../models/pagination";
import { Account, isAccountWxOnly } from "../models/account";
import { articleRepo } from "../repository/article";
import { APIError } from "../models/api-response";
import { Flash } from "../widget/flash";
import { accountMap } from "../config/sitemap";

interface StarredPage {
  pageTitle: string
  flash?: Flash;
  isWxOnly: boolean;
  linkFtcUrl:string;
  articles?: Array<Article>;
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

    const p: StarredPage = {
      pageTitle: "收藏的文章",
      isWxOnly: isAccountWxOnly(this.account),
      linkFtcUrl: accountMap.linkEmail,
    };

    try {
      p.articles = await articleRepo.list(this.account, paging.toObject());

      p.paging = paging.setSize(p.articles.length);
      
      return p;
    } catch (e) {
      const errResp = new APIError(e);

      p.flash = Flash.danger(errResp.message);
      return p;
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
