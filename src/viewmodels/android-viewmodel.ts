import { AndroidRelease } from "../models/android";
import { androidRepo } from "../repository/app-release";
import { UIBase } from "./ui";
import { androidMap } from "../config/sitemap";
import { Paging } from "../models/pagination";

interface UILatest extends UIBase {
    latest?: AndroidRelease;
    allReleasesUrl: string;
}

interface UIReleases extends UIBase {
    releases: Array<AndroidRelease>;
    paging: Paging;
}

class AndroidViewModel {
    
    async latest(): Promise<UILatest>{
        const latest = await androidRepo.latest();

        return {
            latest: latest,
            allReleasesUrl: androidMap.releases,
        };
    }

    async allReleases(paging: Paging): Promise<UIReleases> {
        const releases = await androidRepo.list(paging.toObject());

        return {
            releases: releases,
            paging: paging.setSize(releases.length),
        }
    }
}

export const androidViewModel = new AndroidViewModel();
