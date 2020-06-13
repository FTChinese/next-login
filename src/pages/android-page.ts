import { AndroidRelease } from "../models/android";
import { androidRepo } from "../repository/app-release";
import { androidMap } from "../config/sitemap";
import { Paging } from "../models/pagination";
import { Flash } from "../widget/flash";
import { APIError } from "../models/api-response";

// This is used to contain data both for latest release page and release list page.
interface AndroidPage {
  pageTitle: string;
  heading: string;
  flash?: Flash;
  isLatest: boolean; // Indicate whether this is the latest page or a list of versions page.
  releases: AndroidRelease[];
  allReleasesUrl?: string; // Only on latest page.
  paging?: Paging; // Only when show a list of all version
}

export class AndroidPageBuilder {

  async latest(): Promise<AndroidPage> {

    const p: AndroidPage = {
      pageTitle: "最新版安卓APP",
      heading: "",
      isLatest: true,
      releases: [],
      allReleasesUrl: androidMap.releases,
    };

    try {
      const release = await androidRepo.latest();

      p.heading = `最新版 ${release.versionName}`;
      p.releases = [release];

      return p;
    } catch (e) {
      const errResp = new APIError(e);

      p.flash = Flash.danger(errResp.message)
      return p;
    }
  }

  async allReleases(paging: Paging): Promise<AndroidPage> {
    const p: AndroidPage = {
      pageTitle: "安卓APP历史版本",
      heading: "Android历史版本",
      isLatest: false,
      releases: [],
      paging: paging,
    };

    try {
      const releases = await androidRepo.list(paging.toObject());

      p.releases = releases;
      p.paging = paging.setSize(releases.length);

      return p;
    } catch (e) {
      const errResp = new APIError(e);

      p.flash = Flash.danger(errResp.message);

      return p;
    }
  }
}

export const androidViewModel = new AndroidPageBuilder();
