import Router from "koa-router";
import render from "../util/render";
import {
    appHeader,
} from "./middleware";
import {  
    IAppHeader,
    Account,
    IEmail,
    ICredentials,
} from "../models/reader";
import { 
    accountMap 
} from "../config/sitemap";
import { 
    SavedKey,
} from "../viewmodels/ui";
import {
    accountViewModel,
    IPasswordsFormData,
} from "../viewmodels/account-viewmodel";
import {
    linkViewModel,
} from "../viewmodels/link-viewmodel";
import {
    ISignUpFormData,
} from "../viewmodels/validator";
import { 
    isProduction,
} from "../config/viper";

const router = new Router();



export default router.routes();
