import { AndroidRelease } from "../models/android";
import { androidRepo } from "../repository/app-release";
import { androidMap } from "../config/sitemap";
import { Paging } from "../models/pagination";
import { Flash } from "../widget/flash";
import { APIError } from "../repository/api-response";

interface LatestReleasePage {
  flash?: Flash;
  latest?: AndroidRelease;
  allReleasesUrl: string;
}

interface ReleaseListPage {
  flash?: Flash;
  releases: Array<AndroidRelease>;
  paging?: Paging;
}

export class AndroidPageBuilder {

  async latest(): Promise<LatestReleasePage> {

    try {
      const latest = await androidRepo.latest();

      return {
        latest: latest,
        allReleasesUrl: androidMap.releases,
      };
    } catch (e) {
      const errResp = new APIError(e);

      return {
        flash: Flash.danger(errResp.message),
        allReleasesUrl: androidMap.releases
      }
    }
  }

  async allReleases(paging: Paging): Promise<ReleaseListPage> {
    try {
      const releases = await androidRepo.list(paging.toObject());

      return {
        releases: releases,
        paging: paging.setSize(releases.length),
      };
    } catch (e) {
      const errResp = new APIError(e);

      return {
        flash: Flash.danger(errResp.message),
        releases: [],
      };
    }
  }
}

export const androidViewModel = new AndroidPageBuilder();
