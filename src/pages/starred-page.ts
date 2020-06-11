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
  private flashMsg?: string;
  private articles: Article[] = [];
  private paging?: Paging;

  constructor(readonly account: Account) {}

  async load(paging: Paging): Promise<boolean> {
    try {
      this.articles = await articleRepo.list(this.account, paging.toObject());

      this.paging = paging.setSize(this.articles.length);
      return true;
    } catch (e) {
      this.flashMsg = (new APIError(e)).message;
      return false;
    }
  }

  /**
   * 
   * @param paging 
   * @param errMsg The error message from direction after delete, if present.
   */
  buildUI(errMsg?: string): StarredPage {

    const p: StarredPage = {
      pageTitle: "收藏的文章",
      isWxOnly: isAccountWxOnly(this.account),
      linkFtcUrl: accountMap.linkEmail,
      articles: this.articles,
      paging: this.paging,
    };

    if (errMsg) {
      p.flash = Flash.danger(errMsg);
      return p;
    }

    if (this.flashMsg) {
      p.flash = Flash.danger(this.flashMsg);
    }

    return p
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
